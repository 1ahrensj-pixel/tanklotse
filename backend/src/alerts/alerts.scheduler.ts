import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FuelType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { FUEL_PROVIDER, FuelPriceProvider } from '../providers/fuel-price.interface';
import { PushService } from '../push/push.service';
import { SavingsService } from '../savings/savings.service';
import { AlertsEvaluator, StationPriceSnapshot } from './alerts.evaluator';

/**
 * Buendelt aktive Preisalarme (MAX_PRICE und REAL_SAVING), prueft sie in einem
 * Lauf und sendet Push.
 *
 * Schutz der Tankerkoenig-API:
 *  - Region-Gruppierung (gleiche Koordinate/Radius nur einmal abfragen)
 *  - Provider-Suche pro Gruppe maximal einmal pro Cron-Lauf
 *  - Pro Alarm 6 h Cooldown gegen Spam
 */
@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);
  private readonly evaluator: AlertsEvaluator;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(FUEL_PROVIDER) private readonly provider: FuelPriceProvider,
    private readonly push: PushService,
    private readonly savings: SavingsService,
  ) {
    this.evaluator = new AlertsEvaluator(this.savings);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkAlerts() {
    const now = new Date();
    const dayIso = ((now.getUTCDay() + 6) % 7) + 1;
    const hhmm = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;

    const alerts = await this.prisma.priceAlert.findMany({
      where: { active: true },
      include: { station: true, user: { include: { pushTokens: { where: { revokedAt: null } } } } },
    });
    if (alerts.length === 0) return;

    const groups = new Map<string, { lat: number; lng: number; radius: number; fuel: FuelType }>();
    for (const a of alerts) {
      if (!matchesSchedule(a.daysOfWeek as unknown as number[], dayIso, a.timeWindowStart, a.timeWindowEnd, hhmm)) continue;
      if (a.station) {
        groups.set(`s:${a.stationId}:${a.fuelType}`, {
          lat: Number(a.station.lat), lng: Number(a.station.lng), radius: 0.5, fuel: a.fuelType,
        });
      } else if (a.lat != null && a.lng != null && a.radiusKm != null) {
        groups.set(`r:${a.lat}:${a.lng}:${a.radiusKm}:${a.fuelType}`, {
          lat: Number(a.lat), lng: Number(a.lng), radius: Number(a.radiusKm), fuel: a.fuelType,
        });
      }
    }

    const groupStations = new Map<string, StationPriceSnapshot[]>();
    for (const [key, g] of groups) {
      try {
        const list = await this.provider.search({
          lat: g.lat, lng: g.lng, radius: g.radius, fuelType: g.fuel, sort: 'price',
        });
        const fuelKey = g.fuel.toLowerCase() as 'e5' | 'e10' | 'diesel';
        const snap: StationPriceSnapshot[] = [];
        for (const s of list) {
          const p = s.prices[fuelKey];
          if (typeof p !== 'number') continue;
          snap.push({
            id: s.id,
            lat: s.lat,
            lng: s.lng,
            price: p,
            isOpen: s.isOpen,
            distanceKm: s.distanceKm ?? 0,
          });
        }
        groupStations.set(key, snap);
      } catch (e) {
        this.logger.warn(`Alert-Gruppe ${key} fehlgeschlagen: ${(e as Error).message}`);
      }
    }

    for (const a of alerts) {
      const groupKey = a.station
        ? `s:${a.stationId}:${a.fuelType}`
        : a.lat != null && a.lng != null && a.radiusKm != null
          ? `r:${a.lat}:${a.lng}:${a.radiusKm}:${a.fuelType}`
          : null;
      if (!groupKey) continue;
      const snap = groupStations.get(groupKey);
      if (!snap) continue;

      const trigger = this.evaluator.evaluate(a, snap);
      if (!trigger) continue;

      const lastTrigger = a.lastTriggeredAt?.getTime() ?? 0;
      if (Date.now() - lastTrigger < 6 * 3600 * 1000) continue; // 6 h Cooldown

      await this.prisma.priceAlert.update({ where: { id: a.id }, data: { lastTriggeredAt: new Date() } });

      const tokens = a.user.pushTokens.map((t) => t.fcmToken);
      if (tokens.length > 0) {
        await this.push.sendToTokens(tokens, {
          title:
            a.alertType === 'REAL_SAVING'
              ? 'TankLotse — Echte Ersparnis verfuegbar'
              : 'TankLotse — Preis-Alarm',
          body: trigger.message,
          data: {
            stationId: trigger.stationId,
            fuelType: a.fuelType,
            alertType: a.alertType,
          },
        });
      }
    }
  }
}

function matchesSchedule(
  daysOfWeek: number[],
  todayIso: number,
  start: string | null,
  end: string | null,
  hhmm: string,
): boolean {
  if (!daysOfWeek.includes(todayIso)) return false;
  if (start && hhmm < start) return false;
  if (end && hhmm > end) return false;
  return true;
}
