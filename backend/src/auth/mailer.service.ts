import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASSWORD
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
      });
    }
  }

  async sendVerification(email: string, token: string) {
    const link = `${process.env.API_BASE_URL ?? 'http://localhost:3000'}/api/auth/verify?token=${token}`;
    await this.send(email, 'TankLotse — Bitte E-Mail bestätigen',
      `Willkommen bei TankLotse!\n\nBitte bestätige deine E-Mail-Adresse über folgenden Link:\n${link}\n\nDer Link ist 24 Stunden gültig.`);
  }

  async sendPasswordReset(email: string, token: string) {
    const link = `${process.env.API_BASE_URL ?? 'http://localhost:3000'}/api/auth/reset?token=${token}`;
    await this.send(email, 'TankLotse — Passwort zurücksetzen',
      `Hallo,\n\ndu kannst dein Passwort über folgenden Link zurücksetzen:\n${link}\n\nDer Link ist 30 Minuten gültig. Wenn du dies nicht angefordert hast, kannst du diese E-Mail ignorieren.`);
  }

  private async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.warn(`SMTP nicht konfiguriert; würde senden an ${to}: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'TankLotse <noreply@tanklotse.de>',
        to,
        subject,
        text,
      });
    } catch (e) {
      this.logger.error(`SMTP-Fehler: ${(e as Error).message}`);
    }
  }
}
