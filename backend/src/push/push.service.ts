import { Injectable, Logger } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import * as fs from 'fs';

import { PrismaService } from '../prisma/prisma.service';

interface FcmMessagePayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private projectId: string | null = null;
  private auth: GoogleAuth | null = null;

  constructor(private readonly prisma: PrismaService) {
    const path = process.env.FCM_SERVICE_ACCOUNT_PATH;
    if (path && fs.existsSync(path)) {
      try {
        const sa = JSON.parse(fs.readFileSync(path, 'utf8'));
        this.projectId = sa.project_id ?? null;
        this.auth = new GoogleAuth({
          keyFilename: path,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
      } catch (e) {
        this.logger.error(`FCM-Service-Account konnte nicht geladen werden: ${(e as Error).message}`);
      }
    }
  }

  async registerToken(userId: string, deviceId: string, platform: 'IOS' | 'ANDROID' | 'WEB', fcmToken: string) {
    return this.prisma.pushToken.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: { fcmToken, platform, revokedAt: null },
      create: { userId, deviceId, platform, fcmToken },
    });
  }

  async revoke(userId: string, fcmToken: string) {
    await this.prisma.pushToken.updateMany({
      where: { userId, fcmToken },
      data: { revokedAt: new Date() },
    });
  }

  async sendToTokens(tokens: string[], payload: FcmMessagePayload) {
    if (tokens.length === 0) return;
    if (!this.auth || !this.projectId) {
      this.logger.warn(`Push (mock — kein FCM konfiguriert): ${payload.title}: ${payload.body}`);
      return;
    }
    const client = await this.auth.getClient();
    const accessTokenResp = await client.getAccessToken();
    const accessToken = accessTokenResp.token;
    if (!accessToken) {
      this.logger.error('Kein FCM-Access-Token erhalten.');
      return;
    }
    const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

    for (const token of tokens) {
      try {
        await axios.post(
          url,
          {
            message: {
              token,
              notification: { title: payload.title, body: payload.body },
              data: payload.data,
            },
          },
          { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 5000 },
        );
      } catch (e) {
        this.logger.warn(`Push an Token fehlgeschlagen: ${(e as Error).message}`);
      }
    }
  }
}
