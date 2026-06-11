import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async metrics() {
    const [users, activeAlerts, todaysApiCalls, openComplaints, premium] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.priceAlert.count({ where: { active: true } }),
      this.prisma.apiLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
      this.prisma.complaint.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { premiumStatus: 'ACTIVE' } }),
    ]);
    return { users, activeAlerts, todaysApiCalls, openComplaints, premiumActive: premium };
  }

  listUsers(skip: number, take: number) {
    return this.prisma.user.findMany({
      skip, take, orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, premiumStatus: true, createdAt: true, deletedAt: true },
    });
  }

  apiLogs(skip: number, take: number) {
    return this.prisma.apiLog.findMany({ skip, take, orderBy: { createdAt: 'desc' } });
  }

  errors(skip: number, take: number) {
    return this.prisma.apiLog.findMany({
      skip, take, where: { ok: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  alerts(skip: number, take: number) {
    return this.prisma.priceAlert.findMany({ skip, take, orderBy: { createdAt: 'desc' } });
  }

  complaints(skip: number, take: number) {
    return this.prisma.complaint.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { station: true } });
  }

  featureFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  setFeatureFlag(key: string, enabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled },
      create: { key, enabled },
    });
  }

  async setupTotp(userId: string) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecret: secret, totpEnabled: false } });
    const otpauth = authenticator.keyuri(userId, 'TankLotse-Admin', secret);
    const qr = await QRCode.toDataURL(otpauth);
    return { otpauth, qrDataUrl: qr };
  }

  async confirmTotp(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) throw new BadRequestException('Kein 2FA-Setup gestartet.');
    const ok = authenticator.verify({ token, secret: user.totpSecret });
    if (!ok) throw new BadRequestException('Code ungültig.');
    await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
    return { ok: true };
  }

  async verifyTotp(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabled || !user.totpSecret) throw new BadRequestException('2FA nicht aktiv.');
    const ok = authenticator.verify({ token, secret: user.totpSecret });
    if (!ok) throw new BadRequestException('Code ungültig.');
    // Step-up abgeschlossen: erst JETZT gibt es vollwertige Tokens
    // (der Login lieferte bei totpEnabled nur einen Pre-Auth-Token).
    const tokens = await this.auth.issueTokensFor(user);
    return { ok: true, ...tokens };
  }

  audit(actorId: string | null, action: string, target?: string, metadata?: Record<string, unknown>, ip?: string) {
    const ipPrefix = ip ? ipPrefixOf(ip) : null;
    return this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action,
        target: target ?? null,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        ipPrefix,
      },
    });
  }

  randomToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

function ipPrefixOf(ip: string): string {
  return ip.includes('.') ? ip.split('.').slice(0, 3).join('.') + '.0' : ip.split(':').slice(0, 3).join(':') + '::';
}
