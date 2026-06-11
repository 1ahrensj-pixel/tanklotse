import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string | null;
  role: Role;
  /** 2FA-Step-up: Pre-Auth-Token, das nur /admin/2fa/verify erreichen darf. */
  totpPending?: boolean;
}

/**
 * PR #24 §7.4 — Dual-Secret-Pattern fuer JWT-Verifikation.
 *
 * Beim Rotieren des JWT-Secrets darf eine Uebergangszeit (z.B. 24h)
 * existieren, in der sowohl alte (`JWT_ACCESS_SECRET_PREV`) als auch
 * neue Tokens (`JWT_ACCESS_SECRET`) gueltig sind. Neue Tokens werden
 * NUR mit dem aktuellen Secret signiert (`auth.service.issueTokens()`);
 * die Verifikation hier akzeptiert beide.
 *
 * Migration:
 *   1. Neues Secret erzeugen (`openssl rand -base64 48`).
 *   2. Altes Secret in `JWT_ACCESS_SECRET_PREV` kopieren.
 *   3. Neues Secret in `JWT_ACCESS_SECRET` setzen + Backend neu starten.
 *   4. Existierende Sessions laufen weiter (alt-signed Tokens
 *      verifizieren mit PREV).
 *   5. Nach Access-TTL + Refresh-Rotation: `JWT_ACCESS_SECRET_PREV`
 *      entfernen.
 */
function verifyWithDualSecret(token: string): JwtPayload | null {
  const current = process.env.JWT_ACCESS_SECRET;
  const previous = process.env.JWT_ACCESS_SECRET_PREV;
  if (!current) return null;
  try {
    return jwt.verify(token, current) as JwtPayload;
  } catch {
    if (!previous) return null;
    try {
      return jwt.verify(token, previous) as JwtPayload;
    } catch {
      return null;
    }
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Custom verifier statt secretOrKey: erlaubt sowohl current als
      // auch previous secret zu akzeptieren.
      secretOrKeyProvider: (
        _req: unknown,
        rawJwtToken: string,
        done: (err: Error | null, secretOrKey: string | null) => void,
      ) => {
        const payload = verifyWithDualSecret(rawJwtToken);
        if (payload) {
          // passport-jwt erwartet einen Secret-String. Wir geben ihm
          // einen der beiden — der Verify-Call wiederholt sich, aber
          // wir wissen schon, dass er passt.
          const current = process.env.JWT_ACCESS_SECRET ?? '';
          const previous = process.env.JWT_ACCESS_SECRET_PREV;
          try {
            jwt.verify(rawJwtToken, current);
            return done(null, current);
          } catch {
            if (previous) return done(null, previous);
            return done(null, current);
          }
        }
        done(null, process.env.JWT_ACCESS_SECRET ?? '');
      },
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) throw new UnauthorizedException();
    // totpPending durchreichen, damit JwtAuthGuard Pre-Auth-Tokens
    // ueberall ausser auf /admin/2fa/verify ablehnen kann.
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      ...(payload.totpPending === true ? { totpPending: true } : {}),
    };
  }
}

// Test-Helper exportieren — der `validate`-Pfad ist klar, das
// Dual-Secret-Pattern braucht einen direkten Unit-Test.
export const __testing__ = { verifyWithDualSecret };
