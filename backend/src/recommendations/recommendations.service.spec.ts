import type { FuelPriceProvider, ProviderStation } from '../providers/fuel-price.interface';
import { SavingsService } from '../savings/savings.service';
import { DetourService } from './detour.service';
import { RecommendationsService, haversineKm } from './recommendations.service';

describe('RecommendationsService', () => {
  const stations: ProviderStation[] = [
    {
      id: 'a', name: 'A', brand: 'X', street: 's', houseNumber: '1', postCode: '50996', place: 'Köln',
      lat: 50.93, lng: 6.95, distanceKm: 0.5, isOpen: true,
      prices: { e5: 1.799, e10: 1.749, diesel: 1.679 },
    },
    {
      id: 'b', name: 'B', brand: 'Y', street: 's', houseNumber: '2', postCode: '50996', place: 'Köln',
      lat: 50.94, lng: 6.96, distanceKm: 4.8, isOpen: true,
      prices: { e5: 1.749, e10: 1.689, diesel: 1.629 },
    },
    {
      id: 'c', name: 'C', brand: 'Z', street: 's', houseNumber: '3', postCode: '50996', place: 'Köln',
      lat: 50.92, lng: 6.94, distanceKm: 1.8, isOpen: false, // geschlossen → fliegt raus
      prices: { e5: 1.659, e10: 1.609, diesel: 1.559 },
    },
  ];

  const fakeProvider: FuelPriceProvider = {
    name: 'fake',
    attribution: 'Test',
    async search() { return stations; },
    async getDetail() { throw new Error('not used'); },
    async getPrices() { return {}; },
    async submitComplaint() { return { ok: true, forwarded: false }; },
  };

  const savings = new SavingsService();
  const detour = new DetourService(savings);
  const svc = new RecommendationsService(fakeProvider, detour, savings);

  it('rangiert offene Stationen nach realer Ersparnis (basis=AVG_IN_AREA Default)', async () => {
    const r = await svc.bestStation({
      lat: 50.93, lng: 6.95, radius: 5, fuelType: 'DIESEL',
      consumptionLPer100Km: 8, tankLiters: 50,
    });
    expect(r.recommendations.length).toBe(2);
    expect(r.basis).toBe('AVG_IN_AREA');
    // Antwort enthaelt referencePrice (Durchschnitt der zwei offenen)
    expect(r.referencePrice).toBeCloseTo((1.679 + 1.629) / 2, 3);
    // Sortiert absteigend nach realSaving
    expect(r.recommendations[0].realSavingEuro).toBeGreaterThanOrEqual(
      r.recommendations[1].realSavingEuro,
    );
  });

  it('basis=NEAREST_OPEN nimmt naechste offene Station als Referenz', async () => {
    const r = await svc.bestStation({
      lat: 50.93, lng: 6.95, radius: 5, fuelType: 'DIESEL',
      consumptionLPer100Km: 8, tankLiters: 50,
      basis: 'NEAREST_OPEN',
    });
    expect(r.referenceStationId).toBe('a'); // distance 0.5 ist die naechste offene
    expect(r.referencePrice).toBeCloseTo(1.679, 3);
  });

  it('basis=USER_REFERENCE_STATION wirft 404 wenn ID nicht vorhanden', async () => {
    await expect(
      svc.bestStation({
        lat: 50.93, lng: 6.95, radius: 5, fuelType: 'DIESEL',
        consumptionLPer100Km: 8, tankLiters: 50,
        basis: 'USER_REFERENCE_STATION',
        referenceStationId: 'unknown',
      }),
    ).rejects.toThrow();
  });

  it('jede Empfehlung enthaelt breakEvenLiters (USP §7)', async () => {
    const r = await svc.bestStation({
      lat: 50.93, lng: 6.95, radius: 5, fuelType: 'DIESEL',
      consumptionLPer100Km: 8, tankLiters: 50,
    });
    for (const rec of r.recommendations) {
      // Entweder eine Zahl >= 0 oder null (wenn Ziel nicht guenstiger)
      expect(rec.breakEvenLiters === null || rec.breakEvenLiters >= 0).toBe(true);
    }
  });

  it('haversine: Koelner Dom → Schloss Augustusburg liefert plausible Distanz', () => {
    const d = haversineKm(50.9413, 6.9583, 50.7717, 6.9786);
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(25);
  });

  // Audit 2026-05-06 §14 Aufgabe 6: distance-estimate-mode + disclaimer.
  describe('distanceEstimateMode + disclaimer (Audit §14 Aufgabe 6)', () => {
    beforeEach(() => {
      delete process.env.ROUTING_ENABLED;
      delete process.env.ROUTING_PROVIDER;
    });

    it('bestStation ohne aktiviertes Routing → mode=haversine_approximation, disclaimer mit „Schaetzung"', async () => {
      const r = await svc.bestStation({
        lat: 50.93,
        lng: 6.95,
        radius: 5,
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(r.distanceEstimateMode).toBe('haversine_approximation');
      expect(r.disclaimer).toMatch(/Schaetzung|Luftlinie|Routing-Provider/);
    });

    it('stationsAlongRoute ohne aktiviertes Routing → mode=route_sampling, disclaimer mit „Schaetzung"', async () => {
      const r = await svc.stationsAlongRoute({
        start: { lat: 50.93, lng: 6.95 },
        end: { lat: 50.94, lng: 6.96 },
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(r.distanceEstimateMode).toBe('route_sampling');
      expect(r.disclaimer).toMatch(/Schaetzung|Stichprobe|Routing-Provider/);
    });

    // Audit 2026-05-06 §15 P1: ENV-Konfig allein darf nicht precise_routing
    // setzen, solange kein echter HTTP-Client verdrahtet ist.
    it('Mapbox-Konfig allein erzeugt KEIN precise_routing (bestStation)', async () => {
      process.env.ROUTING_ENABLED = 'true';
      process.env.ROUTING_PROVIDER = 'mapbox';
      process.env.MAPBOX_ACCESS_TOKEN = 'sk.real';
      try {
        const r = await svc.bestStation({
          lat: 50.93,
          lng: 6.95,
          radius: 5,
          fuelType: 'DIESEL',
          consumptionLPer100Km: 8,
          tankLiters: 50,
        });
        expect(r.distanceEstimateMode).toBe('haversine_approximation');
        expect(r.distanceEstimateMode).not.toBe('precise_routing');
        expect(r.disclaimer).not.toBeNull();
      } finally {
        delete process.env.ROUTING_ENABLED;
        delete process.env.ROUTING_PROVIDER;
        delete process.env.MAPBOX_ACCESS_TOKEN;
      }
    });

    it('Mapbox-Konfig allein erzeugt KEIN precise_routing (stationsAlongRoute)', async () => {
      process.env.ROUTING_ENABLED = 'true';
      process.env.ROUTING_PROVIDER = 'mapbox';
      process.env.MAPBOX_ACCESS_TOKEN = 'sk.real';
      try {
        const r = await svc.stationsAlongRoute({
          start: { lat: 50.93, lng: 6.95 },
          end: { lat: 50.94, lng: 6.96 },
          fuelType: 'DIESEL',
          consumptionLPer100Km: 8,
          tankLiters: 50,
        });
        expect(r.distanceEstimateMode).toBe('route_sampling');
        expect(r.distanceEstimateMode).not.toBe('precise_routing');
        expect(r.disclaimer).not.toBeNull();
      } finally {
        delete process.env.ROUTING_ENABLED;
        delete process.env.ROUTING_PROVIDER;
        delete process.env.MAPBOX_ACCESS_TOKEN;
      }
    });

    it('precise_routing erscheint NUR, wenn der RoutingDistanceService precise=true UND extraDistanceKm liefert (Audit §17 Phase 2)', async () => {
      // Stub: liefert precise=true mit extraDistanceKm fuer JEDE Anfrage.
      const preciseRouting = {
        isPreciseRoutingAvailable: () => true,
        async calculateExtraDistanceKm() {
          return { precise: true, extraDistanceKm: 1.2, provider: 'mapbox-stub' };
        },
      };
      const localSvc = new RecommendationsService(
        fakeProvider,
        new DetourService(savings),
        savings,
        preciseRouting,
      );
      const r = await localSvc.bestStation({
        lat: 50.93,
        lng: 6.95,
        radius: 5,
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(r.distanceEstimateMode).toBe('precise_routing');
      expect(r.disclaimer).toBeNull();
      // Audit §17 Phase 2: Per-Empfehlung-Mode + Disclaimer.
      for (const reco of r.recommendations) {
        expect(reco.distanceEstimateMode).toBe('precise_routing');
        expect(reco.disclaimer).toBeNull();
        expect(reco.extraDistanceKm).toBeCloseTo(1.2, 1);
      }
    });

    // PR #12 §16 Aufgabe 7: MockRoutingDistanceService erzeugt im
    // RecommendationsService NIEMALS distanceEstimateMode=precise_routing,
    // egal welcher Use-Case (point_to_station / route_via_station).
    it('MockRoutingDistanceService → distanceEstimateMode bleibt haversine_approximation/route_sampling, NIE precise_routing (PR #12 §16/7)', async () => {
      const { MockRoutingDistanceService } = await import('../routing/mock-routing-distance.service');
      const localSvc = new RecommendationsService(
        fakeProvider,
        new DetourService(savings),
        savings,
        new MockRoutingDistanceService(),
      );

      const a = await localSvc.bestStation({
        lat: 50.93,
        lng: 6.95,
        radius: 5,
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(a.distanceEstimateMode).not.toBe('precise_routing');
      for (const reco of a.recommendations) {
        expect(reco.distanceEstimateMode).not.toBe('precise_routing');
      }

      const b = await localSvc.stationsAlongRoute({
        start: { lat: 50.93, lng: 6.95 },
        end: { lat: 50.94, lng: 6.96 },
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      expect(b.distanceEstimateMode).not.toBe('precise_routing');
      for (const reco of b.recommendations) {
        expect(reco.distanceEstimateMode).not.toBe('precise_routing');
      }
    });

    it('Per-Empfehlung-Mode bleibt haversine_approximation, wenn RoutingService precise=false liefert', async () => {
      const r = await svc.bestStation({
        lat: 50.93,
        lng: 6.95,
        radius: 5,
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      for (const reco of r.recommendations) {
        expect(reco.distanceEstimateMode).toBe('haversine_approximation');
        expect(reco.disclaimer).not.toBeNull();
      }
    });

    // Audit 2026-05-06 §13 Aufgabe 4: routingMode pro Recommendation.
    it('Per-Empfehlung routingMode: bestStation → point_to_station, stationsAlongRoute → route_via_station', async () => {
      const a = await svc.bestStation({
        lat: 50.93,
        lng: 6.95,
        radius: 5,
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      for (const reco of a.recommendations) {
        expect(reco.routingMode).toBe('point_to_station');
      }

      const b = await svc.stationsAlongRoute({
        start: { lat: 50.93, lng: 6.95 },
        end: { lat: 50.94, lng: 6.96 },
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      for (const reco of b.recommendations) {
        expect(reco.routingMode).toBe('route_via_station');
      }
    });

    // Audit 2026-05-06 §13 Aufgabe 2: Top-N begrenzt Routing-Calls.
    it('ROUTING_MAX_CANDIDATES begrenzt Mapbox-Calls (≤ N pro Empfehlungslauf)', async () => {
      // Provider liefert 5 offene Stationen (siehe `stations` mit a/b/c —
      // c ist closed → 2 offene). Wir setzen MAX=1, also darf nur 1 Routing
      // -Call passieren.
      process.env.ROUTING_MAX_CANDIDATES = '1';
      const callCounter = { n: 0 };
      const limitedRouting = {
        isPreciseRoutingAvailable: () => true,
        async calculateExtraDistanceKm() {
          callCounter.n++;
          return { precise: true, extraDistanceKm: 0.7, provider: 'mapbox-stub' };
        },
      };
      const localSvc = new RecommendationsService(
        fakeProvider,
        new DetourService(savings),
        savings,
        limitedRouting,
      );
      try {
        const r = await localSvc.bestStation({
          lat: 50.93,
          lng: 6.95,
          radius: 5,
          fuelType: 'DIESEL',
          consumptionLPer100Km: 8,
          tankLiters: 50,
        });
        // 2 offene Stationen, MAX=1 → exakt 1 Routing-Call.
        expect(callCounter.n).toBe(1);
        // Eine Empfehlung precise, eine fallback → mixed.
        expect(r.distanceEstimateMode).toBe('mixed');
      } finally {
        delete process.env.ROUTING_MAX_CANDIDATES;
      }
    });

    // Audit 2026-05-06 §13 Aufgabe 3: Concurrency begrenzt parallele Calls.
    it('ROUTING_CONCURRENCY begrenzt gleichzeitige aktive Calls (maxActive ≤ N)', async () => {
      // Wir bauen einen FakeProvider mit 12 Stationen und einen Routing-Stub,
      // der die gleichzeitig aktiven Calls trackt.
      const many: ProviderStation[] = Array.from({ length: 12 }, (_, i) => ({
        id: `s${i}`,
        name: `S${i}`,
        brand: 'X',
        street: 's',
        houseNumber: String(i),
        postCode: '50996',
        place: 'Köln',
        lat: 50.9 + i * 0.001,
        lng: 6.95,
        distanceKm: 0.5 + i * 0.1,
        isOpen: true,
        prices: { e5: 1.749, e10: 1.689, diesel: 1.629 },
      }));
      const provider: FuelPriceProvider = {
        name: 'fake-many',
        attribution: 'Test',
        async search() {
          return many;
        },
        async getDetail() {
          throw new Error('nu');
        },
        async getPrices() {
          return {};
        },
        async submitComplaint() {
          return { ok: true, forwarded: false };
        },
      };

      let active = 0;
      let maxActive = 0;
      const slowRouting = {
        isPreciseRoutingAvailable: () => true,
        async calculateExtraDistanceKm() {
          active++;
          maxActive = Math.max(maxActive, active);
          await new Promise((r) => setTimeout(r, 5));
          active--;
          return { precise: true, extraDistanceKm: 0.5, provider: 'mapbox-stub' };
        },
      };

      process.env.ROUTING_CONCURRENCY = '3';
      process.env.ROUTING_MAX_CANDIDATES = '12'; // alle routen
      try {
        const localSvc = new RecommendationsService(
          provider,
          new DetourService(savings),
          savings,
          slowRouting,
        );
        await localSvc.bestStation({
          lat: 50.93,
          lng: 6.95,
          radius: 5,
          fuelType: 'DIESEL',
          consumptionLPer100Km: 8,
          tankLiters: 50,
        });
        expect(maxActive).toBeLessThanOrEqual(3);
        expect(maxActive).toBeGreaterThanOrEqual(2);
      } finally {
        delete process.env.ROUTING_CONCURRENCY;
        delete process.env.ROUTING_MAX_CANDIDATES;
      }
    });

    it('Mixed-Summary: precise fuer Station A, Fallback fuer Station B → BestStationResult.mode=mixed (Audit §17 Phase 2 Aufgabe 5)', async () => {
      // Stub liefert precise nur fuer Station mit ID "a", fuer "b" Fallback.
      const mixedRouting = {
        isPreciseRoutingAvailable: () => true,
        async calculateExtraDistanceKm(input: { station: { lat: number; lng: number } }) {
          // Station a: lat=50.93. Station b: lat=50.94.
          if (input.station.lat === 50.93) {
            return { precise: true, extraDistanceKm: 0.5, provider: 'mapbox-stub' };
          }
          return { precise: false, reason: 'provider_timeout' as const };
        },
      };
      const localSvc = new RecommendationsService(
        fakeProvider,
        new DetourService(savings),
        savings,
        mixedRouting,
      );
      const r = await localSvc.bestStation({
        lat: 50.93,
        lng: 6.95,
        radius: 5,
        fuelType: 'DIESEL',
        consumptionLPer100Km: 8,
        tankLiters: 50,
      });
      // Stations „a" hat lat 50.93 → precise, „b" hat lat 50.94 → fallback.
      const modes = r.recommendations.map((x) => x.distanceEstimateMode);
      expect(modes).toContain('precise_routing');
      expect(modes).toContain('haversine_approximation');
      expect(r.distanceEstimateMode).toBe('mixed');
      expect(r.disclaimer).not.toBeNull();
      expect(r.disclaimer).toMatch(/echter Route|Schaetzung/);
    });
  });

  // Audit-Finding §6 / Pruefbericht 2026-05-06: Dedup-Bug — bei mehrfach
  // gefundenen Stationen blieb der erste (oft schlechtere) Treffer erhalten.
  it('stationsAlongRoute: bei Duplikaten gewinnt die Variante mit kleinster distanceKm', async () => {
    const baseStation: Omit<ProviderStation, 'distanceKm'> = {
      id: 'dup', name: 'Dup', brand: 'X', street: 's', houseNumber: '1', postCode: '50996',
      place: 'Köln', lat: 50.93, lng: 6.95, isOpen: true,
      prices: { e5: 1.749, e10: 1.689, diesel: 1.629 },
    };
    let call = 0;
    const provider: FuelPriceProvider = {
      name: 'fake-route',
      attribution: 'Test',
      async search() {
        // Sample 0: Station ist 6 km vom Sample entfernt
        // Sample 1: Station ist 1.2 km vom Sample entfernt (besser, dichter an Route)
        // Sample 2: Station ist 4 km vom Sample entfernt
        const distancesByCall = [6, 1.2, 4, 5, 3];
        const distanceKm = distancesByCall[call++] ?? 5;
        return [{ ...baseStation, distanceKm }];
      },
      async getDetail() { throw new Error('not used'); },
      async getPrices() { return {}; },
      async submitComplaint() { return { ok: true, forwarded: false }; },
    };
    const localSavings = new SavingsService();
    const localDetour = new DetourService(localSavings);
    const localSvc = new RecommendationsService(provider, localDetour, localSavings);

    const result = await localSvc.stationsAlongRoute({
      start: { lat: 50.93, lng: 6.95 },
      end: { lat: 50.94, lng: 6.96 },
      fuelType: 'DIESEL',
      consumptionLPer100Km: 8,
      tankLiters: 50,
    });

    expect(result.recommendations.length).toBe(1);
    // Der gespeicherte Eintrag muss die kleinste gesehene distanceKm tragen.
    expect(result.recommendations[0].extraDistanceKm).toBeCloseTo(1.2, 5);
  });
});
