import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { PremiumStatus, SubscriptionProvider, SubscriptionStatus } from '@prisma/client';
import axios from 'axios';
import Stripe from 'stripe';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
      });
    }
  }

  async status(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return null;
    // Live-Check gegen expiresAt: ein in der DB noch als ACTIVE/GRACE
    // markiertes, aber bereits abgelaufenes Abo darf nicht als Premium gelten.
    if (sub.expiresAt && sub.expiresAt.getTime() <= Date.now()) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { premiumStatus: PremiumStatus.EXPIRED },
      });
      return null;
    }
    return sub;
  }

  async verifyApple(userId: string, receiptData: string) {
    const sharedSecret = process.env.APPLE_IAP_SHARED_SECRET;
    if (!sharedSecret) throw new BadRequestException('Apple-IAP nicht konfiguriert.');
    const url = 'https://buy.itunes.apple.com/verifyReceipt';
    const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
    let resp = await axios.post(url, { 'receipt-data': receiptData, password: sharedSecret });
    if (resp.data.status === 21007) {
      resp = await axios.post(sandboxUrl, { 'receipt-data': receiptData, password: sharedSecret });
    }
    if (resp.data.status !== 0) {
      throw new BadRequestException(`Apple-Receipt ungültig (status=${resp.data.status}).`);
    }
    const latest = (resp.data.latest_receipt_info ?? [])[0];
    if (!latest) throw new BadRequestException('Kein latest_receipt_info.');
    const expiresMs = Number(latest.expires_date_ms);
    const isActive = expiresMs > Date.now();
    const expiresAt = new Date(expiresMs);
    await this.assertReceiptNotBoundToOtherUser(userId, SubscriptionProvider.APPLE, latest.product_id, expiresAt);
    return this.upsertSubscription(userId, SubscriptionProvider.APPLE, latest.product_id, isActive ? 'ACTIVE' : 'EXPIRED', expiresAt);
  }

  async verifyGoogle(userId: string, productId: string, purchaseToken: string) {
    const path = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;
    const packageName = process.env.APPLE_BUNDLE_ID; // benutzt app id; konfigurierbar
    if (!path || !packageName) throw new BadRequestException('Google-Play-IAP nicht konfiguriert.');
    // Vereinfachte Verifizierung über die Subscriptions-API.
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({ keyFilename: path, scopes: ['https://www.googleapis.com/auth/androidpublisher'] });
    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();
    if (!accessToken) throw new BadRequestException('Kein Google-Access-Token.');

    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    const resp = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const expiry = Number(resp.data.expiryTimeMillis);
    const isActive = expiry > Date.now();
    const expiresAt = new Date(expiry);
    await this.assertReceiptNotBoundToOtherUser(userId, SubscriptionProvider.GOOGLE, productId, expiresAt);
    return this.upsertSubscription(userId, SubscriptionProvider.GOOGLE, productId, isActive ? 'ACTIVE' : 'EXPIRED', expiresAt);
  }

  async stripeWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestException('Stripe nicht konfiguriert.');
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      this.logger.warn(`Stripe Webhook-Signatur ungültig: ${(e as Error).message}`);
      throw new BadRequestException('Signatur ungültig.');
    }
    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = (sub.metadata?.userId as string | undefined) ?? null;
      if (userId) {
        // deleted = Abo endgültig beendet → Premium entziehen.
        const status: SubscriptionStatus = event.type === 'customer.subscription.deleted'
          ? 'CANCELLED'
          : sub.status === 'active'
            ? 'ACTIVE'
            : sub.status === 'canceled' ? 'CANCELLED' : 'PENDING';
        await this.upsertSubscription(
          userId,
          SubscriptionProvider.STRIPE,
          sub.items.data[0]?.price.id ?? 'unknown',
          status,
          new Date(sub.current_period_end * 1000),
        );
      }
    }
    return { received: true };
  }

  /**
   * Schutz gegen geteilte Receipts/Purchase-Tokens: dieselbe Store-Transaktion
   * darf nicht von mehreren Accounts eingelöst werden (Premium-Sharing).
   *
   * Grenze: Das Subscription-Schema hat (noch) kein Feld für die
   * Receipt-Identität (Apple originalTransactionId bzw. Google purchaseToken)
   * — ohne Migration kann nur über (provider, productId, expiresAt)
   * dedupliziert werden. Dieselbe Store-Transaktion liefert beim Verify immer
   * denselben Ablaufzeitpunkt, weitergereichte Receipts werden damit erkannt;
   * nach einer Abo-Verlängerung (neues expiresAt) greift der Check für den
   * neuen Stand erst wieder ab dem ersten erfolgreichen Verify. Sauber wird
   * das erst mit einer transactionRef-Spalte + @@unique([provider,
   * transactionRef]) per Migration.
   */
  private async assertReceiptNotBoundToOtherUser(
    userId: string,
    provider: SubscriptionProvider,
    productId: string,
    expiresAt: Date,
  ) {
    const foreign = await this.prisma.subscription.findFirst({
      where: { provider, productId, expiresAt, userId: { not: userId } },
      select: { id: true },
    });
    if (foreign) {
      throw new ConflictException('Dieses Abo ist bereits einem anderen Konto zugeordnet.');
    }
  }

  private async upsertSubscription(userId: string, provider: SubscriptionProvider, productId: string, status: SubscriptionStatus, expiresAt: Date) {
    // Echtes Upsert ohne Migration: das Schema hat kein @@unique über
    // (userId, provider, productId), daher findFirst + update/create statt
    // prisma.upsert. Wiederholtes Verify desselben Kaufs aktualisiert die
    // bestehende Zeile statt Duplikate anzulegen.
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, provider, productId },
      orderBy: { createdAt: 'desc' },
    });
    const sub = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data: { status, expiresAt },
        })
      : await this.prisma.subscription.create({
          data: { userId, provider, productId, status, expiresAt },
        });
    const premium: PremiumStatus = status === 'ACTIVE' ? 'ACTIVE' : status === 'CANCELLED' ? 'CANCELLED' : status === 'GRACE' ? 'GRACE' : 'EXPIRED';
    await this.prisma.user.update({ where: { id: userId }, data: { premiumStatus: premium } });
    return sub;
  }
}
