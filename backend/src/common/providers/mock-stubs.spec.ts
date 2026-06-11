import { MockAuthProvider } from './mock-auth.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { MockPushProvider } from './mock-push.provider';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) §16 Aufgaben 8-10 — Mock-Stub-Tests.
 */
describe('MockPushProvider — §16 Aufgabe 8', () => {
  it('validiert Payload + sendet keine Live-Push, gibt mock-MessageId zurueck', async () => {
    const svc = new MockPushProvider();
    const r = await svc.sendToToken({
      token: 'mock-device-token-1234',
      title: 'Preisalarm',
      body: 'Diesel lohnt sich jetzt.',
      data: { stationId: 'mock-rod-1' },
    });
    expect(r.ok).toBe(true);
    expect(r.messageId).toMatch(/^mock-/);
    const drained = svc.drainSent();
    expect(drained).toHaveLength(1);
    expect(drained[0].title).toBe('Preisalarm');
  });

  it('Production-Guard blockiert Construct ohne ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true', () => {
    const original = process.env.NODE_ENV;
    const allow = process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      expect(() => new MockPushProvider()).toThrow(/PUSH_PROVIDER_MODE=mock.*production/);
    } finally {
      if (original == null) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = original;
      if (allow == null) delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      else process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = allow;
    }
  });
});

describe('MockAuthProvider — §16 Aufgabe 9', () => {
  it('verifyAppleIdToken: erzeugt Mock-Identitaet aus prefixed Token', async () => {
    const svc = new MockAuthProvider();
    const id = await svc.verifyAppleIdToken('mock-apple-alice');
    expect(id.provider).toBe('apple');
    expect(id.providerUserId).toBe('alice');
    expect(id.email).toMatch(/example\.invalid/);
  });

  it('verifyGoogleIdToken: erzeugt Mock-Identitaet aus prefixed Token', async () => {
    const svc = new MockAuthProvider();
    const id = await svc.verifyGoogleIdToken('mock-google-bob');
    expect(id.provider).toBe('google');
    expect(id.providerUserId).toBe('bob');
  });

  it('weist nicht-mock-Tokens zurueck (keine echten OAuth-Tokens akzeptieren)', async () => {
    const svc = new MockAuthProvider();
    await expect(svc.verifyAppleIdToken('eyJhbGciOiJSUzI1NiI…')).rejects.toThrow();
    await expect(svc.verifyGoogleIdToken('ya29.real-google-token')).rejects.toThrow();
  });

  it('Production-Guard blockiert Construct ohne Allow-Flag', () => {
    const original = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      expect(() => new MockAuthProvider()).toThrow(/AUTH_PROVIDER_MODE=mock.*production/);
    } finally {
      if (original == null) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = original;
    }
  });
});

describe('MockPaymentProvider — §16 Aufgabe 10', () => {
  it('createTestSubscription + getStatus + cancel — In-Memory-Lifecycle', async () => {
    const svc = new MockPaymentProvider();
    const sub = await svc.createTestSubscription({
      customerId: 'cus_mock_1',
      productId: 'premium_monthly',
      status: 'active',
      daysValid: 30,
    });
    expect(sub.status).toBe('active');
    expect(new Date(sub.currentPeriodEnd).getTime()).toBeGreaterThan(Date.now());

    const fetched = await svc.getStatus('cus_mock_1');
    expect(fetched).not.toBeNull();
    expect(fetched!.productId).toBe('premium_monthly');

    const canceled = await svc.cancel('cus_mock_1');
    expect(canceled!.status).toBe('canceled');
  });

  it('Production-Guard blockiert Construct (keine Mock-Premium-Freischaltung in prod)', () => {
    const original = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      expect(() => new MockPaymentProvider()).toThrow(/PAYMENT_PROVIDER_MODE=mock.*production/);
    } finally {
      if (original == null) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = original;
    }
  });
});
