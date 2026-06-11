import { BadRequestException, ConflictException } from '@nestjs/common';
import axios from 'axios';
import Stripe from 'stripe';

import { SubscriptionService } from './subscription.service';

/**
 * Tests laufen ohne echtes Network — axios und google-auth-library werden
 * gemockt, Stripe-Signaturen werden offline mit generateTestHeaderString
 * erzeugt/geprueft.
 */
jest.mock('axios');
jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockResolvedValue({
      getAccessToken: jest.fn().mockResolvedValue({ token: 'google-access-token' }),
    }),
  })),
}));

const axiosMock = axios as jest.Mocked<typeof axios>;

describe('SubscriptionService', () => {
  const FUTURE_MS = Date.now() + 30 * 24 * 3600 * 1000;
  const PAST_MS = Date.now() - 24 * 3600 * 1000;
  const WEBHOOK_SECRET = 'whsec_test_secret';

  let prismaMock: {
    subscription: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    user: { update: jest.Mock };
  };
  let envBackup: NodeJS.ProcessEnv;

  function makeService(): SubscriptionService {
    // Konstruktor liest nur STRIPE_SECRET_KEY; Prisma wird komplett gemockt.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new SubscriptionService(prismaMock as any);
  }

  beforeEach(() => {
    envBackup = { ...process.env };
    process.env.APPLE_IAP_SHARED_SECRET = 'test-shared-secret';
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH = '/tmp/fake-service-account.json';
    process.env.APPLE_BUNDLE_ID = 'de.tanklotse.app';
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    jest.clearAllMocks();
    prismaMock = {
      subscription: {
        // Default: kein fremdes Abo vorhanden → Dedup-Check laesst durch.
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'sub-1', ...data }),
        ),
        update: jest.fn().mockImplementation(
          ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
            Promise.resolve({ id: where.id, ...data }),
        ),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
    };
  });

  afterEach(() => {
    process.env = envBackup;
  });

  function mockAppleReceipt(expiresMs: number) {
    axiosMock.post.mockResolvedValue({
      data: {
        status: 0,
        latest_receipt_info: [
          {
            product_id: 'premium_monthly',
            expires_date_ms: String(expiresMs),
            original_transaction_id: 'orig-tx-1',
          },
        ],
      },
    });
  }

  describe('status()', () => {
    it('ACTIVE-Subscription mit kuenftigem expiresAt → wird zurueckgegeben', async () => {
      const active = {
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        expiresAt: new Date(FUTURE_MS),
      };
      prismaMock.subscription.findFirst.mockResolvedValue(active);
      const service = makeService();

      await expect(service.status('user-1')).resolves.toBe(active);
      expect(prismaMock.subscription.update).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('ACTIVE-Subscription mit abgelaufenem expiresAt → kein Premium, DB wird auf EXPIRED korrigiert', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        expiresAt: new Date(PAST_MS),
      });
      const service = makeService();

      await expect(service.status('user-1')).resolves.toBeNull();
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'EXPIRED' },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'EXPIRED' },
      });
    });
  });

  describe('verifyApple()', () => {
    it('gueltiger Receipt → Subscription ACTIVE + premiumStatus ACTIVE', async () => {
      mockAppleReceipt(FUTURE_MS);
      const service = makeService();
      const sub = await service.verifyApple('user-1', 'base64-receipt');

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: 'APPLE',
          productId: 'premium_monthly',
          status: 'ACTIVE',
        }),
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'ACTIVE' },
      });
      expect((sub as { status: string }).status).toBe('ACTIVE');
    });

    it('abgelaufener Receipt → Subscription EXPIRED, kein Premium', async () => {
      mockAppleReceipt(PAST_MS);
      const service = makeService();
      await service.verifyApple('user-1', 'base64-receipt');

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'EXPIRED' }),
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'EXPIRED' },
      });
    });

    it('wiederholtes Verify desselben Kaufs → Update der bestehenden Zeile, kein Duplikat', async () => {
      mockAppleReceipt(FUTURE_MS);
      // Dedup-Lookup (userId: { not: ... }) → kein fremdes Abo; Upsert-Lookup
      // (userId direkt) findet die beim ersten Verify angelegte Subscription.
      prismaMock.subscription.findFirst.mockImplementation(
        ({ where }: { where: { userId: unknown } }) =>
          Promise.resolve(
            where.userId === 'user-1'
              ? { id: 'sub-existing', userId: 'user-1', provider: 'APPLE', productId: 'premium_monthly' }
              : null,
          ),
      );
      const service = makeService();
      await service.verifyApple('user-1', 'base64-receipt');

      expect(prismaMock.subscription.create).not.toHaveBeenCalled();
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-existing' },
        data: { status: 'ACTIVE', expiresAt: new Date(FUTURE_MS) },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'ACTIVE' },
      });
    });

    it('Receipt eines ANDEREN Users → ConflictException, kein Premium-Grant', async () => {
      mockAppleReceipt(FUTURE_MS);
      // Dedup-Lookup findet ein fremdes Abo mit identischem (provider, productId, expiresAt).
      prismaMock.subscription.findFirst.mockResolvedValue({ id: 'sub-fremd' });
      const service = makeService();

      await expect(service.verifyApple('user-2', 'base64-receipt')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prismaMock.subscription.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider: 'APPLE',
            productId: 'premium_monthly',
            expiresAt: new Date(FUTURE_MS),
            userId: { not: 'user-2' },
          }),
        }),
      );
      expect(prismaMock.subscription.create).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('Apple-Status != 0 → BadRequestException', async () => {
      axiosMock.post.mockResolvedValue({ data: { status: 21002 } });
      const service = makeService();
      await expect(service.verifyApple('user-1', 'kaputt')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ohne APPLE_IAP_SHARED_SECRET → BadRequestException', async () => {
      delete process.env.APPLE_IAP_SHARED_SECRET;
      const service = makeService();
      await expect(service.verifyApple('user-1', 'receipt')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('verifyGoogle()', () => {
    it('gueltiger Purchase-Token → Subscription ACTIVE + premiumStatus ACTIVE', async () => {
      axiosMock.get.mockResolvedValue({ data: { expiryTimeMillis: String(FUTURE_MS) } });
      const service = makeService();
      await service.verifyGoogle('user-1', 'premium_monthly', 'purchase-token-abc');

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: 'GOOGLE',
          productId: 'premium_monthly',
          status: 'ACTIVE',
        }),
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'ACTIVE' },
      });
    });

    it('abgelaufenes Abo → Subscription EXPIRED, kein Premium', async () => {
      axiosMock.get.mockResolvedValue({ data: { expiryTimeMillis: String(PAST_MS) } });
      const service = makeService();
      await service.verifyGoogle('user-1', 'premium_monthly', 'purchase-token-abc');

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'EXPIRED' }),
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'EXPIRED' },
      });
    });

    it('Purchase-Token eines ANDEREN Users → ConflictException, kein Premium-Grant', async () => {
      axiosMock.get.mockResolvedValue({ data: { expiryTimeMillis: String(FUTURE_MS) } });
      prismaMock.subscription.findFirst.mockResolvedValue({ id: 'sub-fremd' });
      const service = makeService();

      await expect(
        service.verifyGoogle('user-2', 'premium_monthly', 'purchase-token-abc'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.subscription.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider: 'GOOGLE',
            productId: 'premium_monthly',
            userId: { not: 'user-2' },
          }),
        }),
      );
      expect(prismaMock.subscription.create).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('ohne Google-Play-Konfiguration → BadRequestException', async () => {
      delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;
      const service = makeService();
      await expect(
        service.verifyGoogle('user-1', 'premium_monthly', 'token'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('stripeWebhook()', () => {
    function signedPayload(event: Record<string, unknown>): { rawBody: Buffer; signature: string } {
      const payload = JSON.stringify(event);
      const stripe = new Stripe('sk_test_dummy', {
        apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
      });
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: WEBHOOK_SECRET,
      });
      return { rawBody: Buffer.from(payload), signature };
    }

    it('ungueltige Signatur → BadRequestException', async () => {
      const service = makeService();
      await expect(service.stripeWebhook(Buffer.from('{}'), 'sig-falsch')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prismaMock.subscription.create).not.toHaveBeenCalled();
    });

    it('customer.subscription.updated (active) → Subscription ACTIVE + premiumStatus ACTIVE', async () => {
      const { rawBody, signature } = signedPayload({
        id: 'evt_1',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_1',
            object: 'subscription',
            status: 'active',
            metadata: { userId: 'user-1' },
            items: { data: [{ price: { id: 'price_premium' } }] },
            current_period_end: Math.floor(FUTURE_MS / 1000),
          },
        },
      });
      const service = makeService();
      const result = await service.stripeWebhook(rawBody, signature);

      expect(result).toEqual({ received: true });
      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: 'STRIPE',
          productId: 'price_premium',
          status: 'ACTIVE',
        }),
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'ACTIVE' },
      });
    });

    it('customer.subscription.deleted → Subscription CANCELLED + Premium entzogen', async () => {
      const { rawBody, signature } = signedPayload({
        id: 'evt_2',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_1',
            object: 'subscription',
            status: 'canceled',
            metadata: { userId: 'user-1' },
            items: { data: [{ price: { id: 'price_premium' } }] },
            current_period_end: Math.floor(FUTURE_MS / 1000),
          },
        },
      });
      // Upsert-Lookup findet die beim Kauf angelegte Stripe-Subscription.
      prismaMock.subscription.findFirst.mockResolvedValue({
        id: 'sub-existing',
        userId: 'user-1',
        provider: 'STRIPE',
        productId: 'price_premium',
      });
      const service = makeService();
      const result = await service.stripeWebhook(rawBody, signature);

      expect(result).toEqual({ received: true });
      expect(prismaMock.subscription.create).not.toHaveBeenCalled();
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-existing' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { premiumStatus: 'CANCELLED' },
      });
    });

    it('ohne Stripe-Konfiguration → BadRequestException', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const service = makeService();
      await expect(service.stripeWebhook(Buffer.from('{}'), 'sig')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
