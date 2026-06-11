import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { OauthService } from './oauth.service';
import { MailerService } from './mailer.service';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// Kurze TTL fuer den Pre-Auth-Token im 2FA-Step-up: das Fenster zwischen
// Passwort-Login und TOTP-Eingabe soll bewusst klein sein.
const TOTP_PENDING_TTL_SEC = 300;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Antwort fuer Logins mit aktiviertem 2FA: KEIN vollwertiger Token,
 * sondern ein kurzlebiger Pre-Auth-Token (Claim `totpPending: true`),
 * der ausschliesslich POST /admin/2fa/verify erreichen darf
 * (Enforcement in JwtAuthGuard). Erst der Verify-Endpunkt stellt bei
 * gueltigem Code vollwertige Tokens aus.
 */
export interface TotpChallenge {
  totpRequired: true;
  preAuthToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly oauth: OauthService,
    private readonly mailer: MailerService,
  ) {}

  async register(email: string, password: string): Promise<AuthTokens> {
    if (password.length < 12) {
      throw new BadRequestException('Passwort muss mindestens 12 Zeichen lang sein.');
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // 409 Conflict ist semantisch korrekt fuer "Resource existiert bereits";
      // 400 wuerde Clients verleiten, an der Eingabe-Validierung zu drehen.
      throw new ConflictException('E-Mail bereits registriert.');
    }
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: { email, passwordHash, role: Role.USER },
    });
    await this.sendVerificationEmail(user);
    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens | TotpChallenge> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Keine Benutzeraufzählung – konstanter Fehler.
      throw new UnauthorizedException('Login fehlgeschlagen.');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Konto vorübergehend gesperrt.');
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      const failed = user.failedLogins + 1;
      const lockedUntil = failed >= MAX_FAILED_LOGINS
        ? new Date(Date.now() + LOCK_MINUTES * 60_000)
        : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: failed, lockedUntil },
      });
      throw new UnauthorizedException('Login fehlgeschlagen.');
    }
    if (user.failedLogins > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }
    if (user.totpEnabled) {
      // Step-up: Passwort allein genuegt nicht — erst nach gueltigem
      // TOTP-Code (POST /admin/2fa/verify) gibt es vollwertige Tokens.
      return this.issueTotpChallenge(user);
    }
    return this.issueTokens(user);
  }

  async loginWithApple(identityToken: string): Promise<AuthTokens> {
    const identity = await this.oauth.verifyApple(identityToken);
    return this.upsertExternal({ provider: 'apple', subject: identity.sub, email: identity.email ?? null });
  }

  async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const identity = await this.oauth.verifyGoogle(idToken);
    return this.upsertExternal({ provider: 'google', subject: identity.sub, email: identity.email ?? null });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh-Token ungültig.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('Refresh-Token ungültig.');
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(refreshToken), userId },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Keine Information leaken
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        purpose: 'password_reset',
        expiresAt: new Date(Date.now() + 30 * 60_000),
      },
    });
    await this.mailer.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    if (newPassword.length < 12) {
      throw new BadRequestException('Passwort zu kurz.');
    }
    const stored = await this.prisma.emailToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!stored || stored.usedAt || stored.expiresAt < new Date() || stored.purpose !== 'password_reset') {
      throw new BadRequestException('Token ungültig.');
    }
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash, failedLogins: 0, lockedUntil: null },
      }),
      this.prisma.emailToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /**
   * Audit-Auftrag §4.1 — Controller-Logik in den Service verschoben.
   * Liefert das Profil des aktuell eingeloggten Nutzers in einer
   * bewusst eingeschraenkten Sicht (keine Passwort-Hashes, keine
   * Refresh-Tokens, kein 2FA-Secret).
   */
  async getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        premiumStatus: true,
        createdAt: true,
      },
    });
  }

  async verifyEmail(token: string) {
    const stored = await this.prisma.emailToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!stored || stored.usedAt || stored.expiresAt < new Date() || stored.purpose !== 'verify_email') {
      throw new BadRequestException('Token ungültig.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { emailVerified: true } }),
      this.prisma.emailToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    ]);
  }

  async deleteAccount(userId: string) {
    // DSGVO: harte Löschung. Cascade kümmert sich um Folgereferenzen.
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        consents: true,
        vehicles: true,
        favorites: true,
        alerts: true,
        pushTokens: true,
        complaints: true,
        subscriptions: true,
        savedRoutes: true,
      },
    });
    if (!user) return null;
    // Sensible Felder bei Export entfernen
    const { passwordHash: _ph, totpSecret: _ts, ...safe } = user;
    return safe;
  }

  /**
   * Stellt nach erfolgreicher 2FA-Verifikation (AdminService.verifyTotp)
   * vollwertige Tokens aus — exakt derselbe Pfad wie beim normalen Login,
   * damit Refresh-Token-Handling und TTLs identisch bleiben.
   */
  issueTokensFor(user: User): Promise<AuthTokens> {
    return this.issueTokens(user);
  }

  // ---------------- Hilfen --------------------------------------------

  private async issueTotpChallenge(user: User): Promise<TotpChallenge> {
    const preAuthToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, totpPending: true },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: `${TOTP_PENDING_TTL_SEC}s` },
    );
    // Bewusst KEIN Refresh-Token: der Pre-Auth-Token ist nicht verlaengerbar.
    return { totpRequired: true, preAuthToken };
  }

  private async upsertExternal(args: { provider: 'apple' | 'google'; subject: string; email: string | null }): Promise<AuthTokens> {
    const where = args.provider === 'apple' ? { appleId: args.subject } : { googleId: args.subject };
    let user = await this.prisma.user.findFirst({ where });
    if (!user && args.email) {
      user = await this.prisma.user.findUnique({ where: { email: args.email } });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: args.provider === 'apple' ? { appleId: args.subject } : { googleId: args.subject },
        });
      }
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: args.email,
          ...(args.provider === 'apple' ? { appleId: args.subject } : { googleId: args.subject }),
          emailVerified: Boolean(args.email),
          role: Role.USER,
        },
      });
    }
    return this.issueTokens(user);
  }

  private async sendVerificationEmail(user: User) {
    if (!user.email) return;
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        purpose: 'verify_email',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });
    await this.mailer.sendVerification(user.email, token);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: `${process.env.JWT_ACCESS_TTL ?? 900}s` },
    );
    const refreshTtlSec = Number(process.env.JWT_REFRESH_TTL ?? 2592000);
    const refreshToken = crypto.randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtlSec * 1000),
      },
    });
    return { accessToken, refreshToken };
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
