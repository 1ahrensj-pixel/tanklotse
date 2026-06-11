import { AlertType, PriceAlert } from '@prisma/client';

import { SavingsService } from '../savings/savings.service';

export interface StationPriceSnapshot {
  id: string;
  lat: number;
  lng: number;
  price: number;
  isOpen: boolean;
  /** Distanz vom Alert-Center zur Station in km. */
  distanceKm: number;
}

export interface AlertTrigger {
  alertId: string;
  stationId: string;
  triggerPrice: number;
  realSavingEuro?: number;
  message: string;
}

/**
 * Reine Logik-Klasse — keine I/O. Bekommt Alert + Stations-Snapshot + SavingsService
 * und entscheidet, ob/wie der Alert zu triggern ist.
 *
 * MAX_PRICE: triggert wenn isOpen && price <= maxPrice.
 * REAL_SAVING: triggert wenn realSaving >= minRealSavingEur && extraDistance <= maxExtraDistanceKm.
 */
export class AlertsEvaluator {
  constructor(private readonly savings: SavingsService) {}

  evaluateMaxPrice(alert: PriceAlert, stations: StationPriceSnapshot[]): AlertTrigger | null {
    const maxPrice = Number(alert.maxPrice);
    const onlyOpen = alert.onlyOpen;
    const candidates = stations.filter((s) => (!onlyOpen || s.isOpen) && s.price <= maxPrice);
    if (candidates.length === 0) return null;
    const cheapest = candidates.reduce((a, b) => (a.price <= b.price ? a : b));
    return {
      alertId: alert.id,
      stationId: cheapest.id,
      triggerPrice: cheapest.price,
      message: `${alert.fuelType} jetzt fuer ${cheapest.price.toFixed(3).replace('.', ',')} €/L verfuegbar.`,
    };
  }

  evaluateRealSaving(alert: PriceAlert, stations: StationPriceSnapshot[]): AlertTrigger | null {
    if (
      alert.minRealSavingEur == null ||
      alert.tankLiters == null ||
      alert.consumptionLPer100Km == null
    ) {
      return null;
    }
    const minSaving = Number(alert.minRealSavingEur);
    const tankLiters = Number(alert.tankLiters);
    const consumption = Number(alert.consumptionLPer100Km);
    const maxExtraDistanceKm = alert.maxExtraDistanceKm == null ? Number.POSITIVE_INFINITY : Number(alert.maxExtraDistanceKm);
    const onlyOpen = alert.onlyOpen;

    const open = stations.filter((s) => !onlyOpen || s.isOpen);
    if (open.length === 0) return null;

    // Vergleichsbasis: Durchschnittspreis im Suchgebiet.
    const avg = open.reduce((sum, s) => sum + s.price, 0) / open.length;

    let best: { station: StationPriceSnapshot; realSaving: number } | null = null;
    for (const s of open) {
      if (s.distanceKm > maxExtraDistanceKm) continue;
      const r = this.savings.calculate({
        referencePrice: avg,
        targetPrice: s.price,
        extraDistanceKm: s.distanceKm,
        consumptionLPer100Km: consumption,
        tankLiters,
        dataConfidence: s.isOpen ? 'high' : 'low',
      });
      if (r.realSavingEuro >= minSaving && (!best || r.realSavingEuro > best.realSaving)) {
        best = { station: s, realSaving: r.realSavingEuro };
      }
    }
    if (!best) return null;
    return {
      alertId: alert.id,
      stationId: best.station.id,
      triggerPrice: best.station.price,
      realSavingEuro: best.realSaving,
      message: `Echte Ersparnis ${best.realSaving.toFixed(2).replace('.', ',')} € verfuegbar (${alert.fuelType} fuer ${best.station.price.toFixed(3).replace('.', ',')} €/L).`,
    };
  }

  evaluate(alert: PriceAlert, stations: StationPriceSnapshot[]): AlertTrigger | null {
    return alert.alertType === AlertType.REAL_SAVING
      ? this.evaluateRealSaving(alert, stations)
      : this.evaluateMaxPrice(alert, stations);
  }
}
