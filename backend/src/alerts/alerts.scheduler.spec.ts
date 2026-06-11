import { AlertType, FuelType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { SavingsService } from '../savings/savings.service';
import type { FuelPriceProvider, ProviderStation } from '../providers/fuel-price.interface';
import type { PrismaService } from '../prisma/prisma.service';
import type { PushService } from '../push/push.service';
import { AlertsScheduler } from './alerts.scheduler';

/**
 * §7.6 (externer Pruefbericht): Pflicht-Tests fuer den Scheduler
 *  - zwei Alerts in gleicher Region → ein Provider-Aufruf
 *  - RealSavingAlert triggert bei echter Ersparnis
 *  - Kein Trigger bei zu hohem Umweg
 *  - Kein Trigger bei geschlossener Tankstelle
 *  - Cooldown verhindert Doppelbenachrichtigung
 */

function alertRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'a1',
    userId: 'u1',
    stationId: null,
    fuelType: FuelType.DIESEL,
    radiusKm: new Decimal(5),
    lat: new Decimal(50.93),
    lng: new Decimal(6.95),
    maxPrice: new Decimal(1.6),
    active: true,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    timeWindowStart: null,
    timeWindowEnd: null,
    lastTriggeredAt: null,
    alertType: AlertType.MAX_PRICE,
    minRealSavingEur: null,
    tankLiters: null,
    consumptionLPer100Km: null,
    maxExtraDistanceKm: null,
    onlyOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    station: null,
    user: { pushTokens: [{ fcmToken: 'fcm-1' }] },
    ...overrides,
  };
}

function station(over: Partial<ProviderStation> = {}): ProviderStation {
  return {
    id: 's1',
    name: 'X',
    brand: 'Y',
    street: 'A',
    houseNumber: '1',
    postCode: '50996',
    place: 'Köln',
    lat: 50.93,
    lng: 6.95,
    distanceKm: 1.0,
    isOpen: true,
    prices: { e5: null, e10: null, diesel: 1.55 },
    ...over,
  };
}

class FakePrisma {
  alerts: ReturnType<typeof alertRecord>[] = [];
  updates: Array<{ id: string; data: Record<string, unknown> }> = [];
  priceAlert = {
    findMany: jest.fn(async () => this.alerts),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      this.updates.push({ id: where.id, data });
      const a = this.alerts.find((x) => x.id === where.id);
      if (a) Object.assign(a, data);
      return a;
    }),
  };
}

class CountingProvider implements FuelPriceProvider {
  readonly name = 'count';
  readonly attribution = 'Test';
  searchCalls = 0;
  constructor(private readonly result: ProviderStation[]) {}
  async search() {
    this.searchCalls += 1;
    return this.result;
  }
  async getDetail(): Promise<never> { throw new Error('not used'); }
  async getPrices() { return {}; }
  async submitComplaint() { return { ok: true, forwarded: false }; }
}

class FakePush {
  sent: Array<{ tokens: string[]; title: string; body: string }> = [];
  sendToTokens = jest.fn(async (tokens: string[], payload: { title: string; body: string }) => {
    this.sent.push({ tokens, title: payload.title, body: payload.body });
  });
}

function makeScheduler(prisma: FakePrisma, provider: FuelPriceProvider, push: FakePush) {
  return new AlertsScheduler(
    prisma as unknown as PrismaService,
    provider,
    push as unknown as PushService,
    new SavingsService(),
  );
}

describe('AlertsScheduler', () => {
  it('§7.6 Fall 1: zwei Alerts in gleicher Region → ein Provider-Aufruf', async () => {
    const prisma = new FakePrisma();
    prisma.alerts = [
      alertRecord({ id: 'a1' }),
      alertRecord({ id: 'a2' }), // gleiche lat/lng/radius/fuel
    ];
    const provider = new CountingProvider([station()]);
    const sched = makeScheduler(prisma, provider, new FakePush());
    await sched.checkAlerts();
    expect(provider.searchCalls).toBe(1);
  });

  it('§7.6 Fall 2: RealSavingAlert triggert bei echter Ersparnis', async () => {
    const prisma = new FakePrisma();
    prisma.alerts = [
      alertRecord({
        alertType: AlertType.REAL_SAVING,
        minRealSavingEur: new Decimal(3),
        tankLiters: new Decimal(50),
        consumptionLPer100Km: new Decimal(7),
        maxExtraDistanceKm: new Decimal(10),
      }),
    ];
    const provider = new CountingProvider([
      station({ id: 's1', prices: { e5: null, e10: null, diesel: 1.79 }, distanceKm: 0.5 }),
      station({ id: 's2', prices: { e5: null, e10: null, diesel: 1.55 }, distanceKm: 1.0 }),
    ]);
    const push = new FakePush();
    const sched = makeScheduler(prisma, provider, push);
    await sched.checkAlerts();
    expect(push.sent.length).toBe(1);
    expect(push.sent[0].title).toContain('Ersparnis');
  });

  it('§7.6 Fall 3: Kein Trigger bei zu hohem Umweg (maxExtraDistanceKm)', async () => {
    const prisma = new FakePrisma();
    prisma.alerts = [
      alertRecord({
        alertType: AlertType.REAL_SAVING,
        minRealSavingEur: new Decimal(3),
        tankLiters: new Decimal(50),
        consumptionLPer100Km: new Decimal(7),
        maxExtraDistanceKm: new Decimal(0.4), // zu eng
      }),
    ];
    const provider = new CountingProvider([
      station({ id: 's2', prices: { e5: null, e10: null, diesel: 1.55 }, distanceKm: 1.0 }),
    ]);
    const push = new FakePush();
    const sched = makeScheduler(prisma, provider, push);
    await sched.checkAlerts();
    expect(push.sent.length).toBe(0);
  });

  it('§7.6 Fall 4: Kein Trigger bei geschlossener Tankstelle (onlyOpen=true)', async () => {
    const prisma = new FakePrisma();
    prisma.alerts = [
      alertRecord({
        alertType: AlertType.MAX_PRICE,
        maxPrice: new Decimal(1.6),
        onlyOpen: true,
      }),
    ];
    const provider = new CountingProvider([
      station({ id: 's2', isOpen: false, prices: { e5: null, e10: null, diesel: 1.55 } }),
    ]);
    const push = new FakePush();
    const sched = makeScheduler(prisma, provider, push);
    await sched.checkAlerts();
    expect(push.sent.length).toBe(0);
  });

  it('§7.6 Fall 5: Cooldown verhindert Doppelbenachrichtigung', async () => {
    const prisma = new FakePrisma();
    const recent = new Date(Date.now() - 60 * 60 * 1000); // 1 h alt — Cooldown ist 6 h
    prisma.alerts = [
      alertRecord({
        alertType: AlertType.MAX_PRICE,
        maxPrice: new Decimal(1.6),
        lastTriggeredAt: recent,
      }),
    ];
    const provider = new CountingProvider([station({ prices: { e5: null, e10: null, diesel: 1.55 } })]);
    const push = new FakePush();
    const sched = makeScheduler(prisma, provider, push);
    await sched.checkAlerts();
    expect(push.sent.length).toBe(0);
  });
});
