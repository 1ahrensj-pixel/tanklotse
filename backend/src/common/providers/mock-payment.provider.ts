import { Injectable } from '@nestjs/common';

import { assertMockAllowed } from './provider-mode.types';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Mock-Payment.
 *
 * Vorbereitung. Der reale `SubscriptionService` (Stripe + Apple/Google IAP)
 * bleibt unberuehrt. Dieser Stub liefert deterministische Subscription-States
 * fuer Vertrags-Tests, ohne echte Stripe-/Apple-/Google-Webhooks zu kennen.
 *
 * Ehrliche Trennung:
 *   - Bezahlt nichts. Verarbeitet keine echten Quittungen.
 *   - In `ApiReadinessService` als `mock_ready` ausgewiesen.
 */
export type MockSubscriptionStatus = 'active' | 'trialing' | 'expired' | 'canceled';

export interface MockSubscription {
  customerId: string;
  productId: 'premium_monthly' | 'premium_yearly';
  status: MockSubscriptionStatus;
  currentPeriodEnd: string;
}

@Injectable()
export class MockPaymentProvider {
  readonly name = 'mock';
  private readonly subs = new Map<string, MockSubscription>();

  constructor() {
    assertMockAllowed('payment');
  }

  async createTestSubscription(input: Omit<MockSubscription, 'currentPeriodEnd'> & {
    daysValid?: number;
  }): Promise<MockSubscription> {
    const days = input.daysValid ?? 30;
    const sub: MockSubscription = {
      customerId: input.customerId,
      productId: input.productId,
      status: input.status,
      currentPeriodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.subs.set(sub.customerId, sub);
    return sub;
  }

  async getStatus(customerId: string): Promise<MockSubscription | null> {
    return this.subs.get(customerId) ?? null;
  }

  async cancel(customerId: string): Promise<MockSubscription | null> {
    const sub = this.subs.get(customerId);
    if (!sub) return null;
    const updated: MockSubscription = { ...sub, status: 'canceled' };
    this.subs.set(customerId, updated);
    return updated;
  }
}
