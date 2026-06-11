import { ApiReadinessService } from './api-readiness.service';
import { RoutingMetricsService } from '../../routing/routing-metrics.service';

/**
 * Audit 2026-05-06 §22 Phase 2 + §14.1: Status-Endpoint gibt KEINE
 * Secret-Werte zurueck. Tests verifizieren:
 *  - Status-Mapping (ok / missing_config / disabled)
 *  - liveSmokeRunnable spiegelt Konfiguration, nicht „letzter Call ok"
 *  - Sentinel-Secrets erscheinen nirgends in der Antwort
 *  - Cost-Control-Defaults (Audit §13)
 *  - Metrics-Snapshot
 */
describe('ApiReadinessService — Audit §22 Phase 2', () => {
  function makeSvc() {
    const metrics = new RoutingMetricsService();
    return { svc: new ApiReadinessService(metrics), metrics };
  }

  // Audit §10 Aufgabe 6: alle relevanten Secrets als Sentinel pruefen.
  describe('Sicherheit: keine Secret-Werte in der Antwort', () => {
    const sentinels = {
      tankerkoenig: 'sentinel-tankerkoenig-XYZ-1234567890',
      mapbox: 'sentinel-mapbox-XYZ-1234567890-pkpkpk',
      graphhopper: 'sentinel-graphhopper-XYZ-1234567890',
      jwt: 'sentinel-jwt-access-XYZ-1234567890-32chars',
      cookie: 'sentinel-cookie-XYZ-1234567890-32-chars-min',
    };

    it.each(Object.entries(sentinels))(
      'kein %s-Wert erscheint in JSON.stringify(snapshot)',
      (label, sentinel) => {
        const { svc } = makeSvc();
        const env = {
          FUEL_PROVIDER: 'tankerkoenig',
          TANKERKOENIG_API_KEY: sentinels.tankerkoenig,
          ROUTING_ENABLED: 'true',
          ROUTING_PROVIDER: 'mapbox',
          MAPBOX_ACCESS_TOKEN: sentinels.mapbox,
          GRAPHHOPPER_API_KEY: sentinels.graphhopper,
          JWT_ACCESS_SECRET: sentinels.jwt,
          COOKIE_SECRET: sentinels.cookie,
          GEOCODER_PROVIDER: 'nominatim',
          NOMINATIM_USER_AGENT: 'TankLotse-Staging/1.0',
        };
        const json = JSON.stringify(svc.snapshot(env as NodeJS.ProcessEnv));
        expect(json).not.toContain(sentinel);
        // Variablen-NAMEN duerfen erscheinen, Werte nicht.
        expect(label.length).toBeGreaterThan(0); // suppress unused
      },
    );

    it('missingKeys enthaelt nur Variablennamen, keine Werte', () => {
      const { svc } = makeSvc();
      const env = {
        FUEL_PROVIDER: 'tankerkoenig',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
      };
      const r = svc.snapshot(env as NodeJS.ProcessEnv);
      // Routing-MAPBOX_ACCESS_TOKEN fehlt → missingKeys enthaelt den Namen.
      expect(r.routing.missingKeys).toEqual(['MAPBOX_ACCESS_TOKEN']);
    });
  });

  // Audit §10 Aufgabe 1: liveSmokeRunnable / liveVerified / lastLive*.
  describe('Status-Mapping + Live-Check-Felder', () => {
    it('Tankerkoenig konfiguriert → fuel.status=ok, liveSmokeRunnable=true, liveVerified=false, lastLiveStatus=not_checked', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'real-key',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.status).toBe('ok');
      expect(r.fuel.liveSmokeRunnable).toBe(true);
      expect(r.fuel.liveVerified).toBe(false);
      expect(r.fuel.lastLiveCheckAt).toBeNull();
      expect(r.fuel.lastLiveStatus).toBe('not_checked');
      expect(r.fuel.missingKeys).toEqual([]);
    });

    it('Tankerkoenig ohne Key → status=missing_config, liveSmokeRunnable=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.status).toBe('missing_config');
      expect(r.fuel.liveSmokeRunnable).toBe(false);
      expect(r.fuel.missingKeys).toContain('TANKERKOENIG_API_KEY');
    });

    it('ROUTING_ENABLED=false → routing.status=disabled, liveSmokeRunnable=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.routing.status).toBe('disabled');
      expect(r.routing.liveSmokeRunnable).toBe(false);
    });

    it('ROUTING_ENABLED=true + mapbox + Token → routing.status=ok, liveSmokeRunnable=true, liveVerified=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'pk.realistic-test-token-1234567890abcdef',
      } as NodeJS.ProcessEnv);
      expect(r.routing.status).toBe('ok');
      expect(r.routing.liveSmokeRunnable).toBe(true);
      expect(r.routing.liveVerified).toBe(false);
      expect(r.routing.lastLiveStatus).toBe('not_checked');
    });

    it('ROUTING_ENABLED=true + mapbox + kein Token → status=missing_config, liveSmokeRunnable=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
      } as NodeJS.ProcessEnv);
      expect(r.routing.status).toBe('missing_config');
      expect(r.routing.missingKeys).toContain('MAPBOX_ACCESS_TOKEN');
      expect(r.routing.liveSmokeRunnable).toBe(false);
    });
  });

  // Audit §10 Aufgabe 2 (Intensiv-Audit): MTS-K hat keinen Live-Smoke +
  // keinen produktiven FuelProvider-Code → not_implemented, nicht ok.
  describe('Fuel-Provider provider-spezifische liveSmokeRunnable-Logik', () => {
    it('FUEL_PROVIDER=tankerkoenig + Key → status=ok, liveSmokeRunnable=true', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'real-key',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.status).toBe('ok');
      expect(r.fuel.liveSmokeRunnable).toBe(true);
      expect(r.fuel.notes).toBeUndefined();
    });

    it('FUEL_PROVIDER=mtsk + Key → status=not_implemented, liveSmokeRunnable=false, mit Note', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'mtsk',
        MTSK_API_KEY: 'real-mtsk-key',
        MTSK_BASE_URL: 'https://mtsk.example.de',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.status).toBe('not_implemented');
      expect(r.fuel.liveSmokeRunnable).toBe(false);
      expect(r.fuel.configured).toBe(true);
      expect(r.fuel.notes).toBeDefined();
      expect(r.fuel.notes!.join(' ')).toMatch(/MTS-K|Smoke-Script/i);
    });

    it('FUEL_PROVIDER=mtsk ohne Key → status=missing_config, liveSmokeRunnable=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'mtsk',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.status).toBe('missing_config');
      expect(r.fuel.liveSmokeRunnable).toBe(false);
      expect(r.fuel.missingKeys).toContain('MTSK_API_KEY');
    });

    it('FUEL_PROVIDER=mock (in test) → status=disabled, liveSmokeRunnable=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        FUEL_PROVIDER: 'mock',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.status).toBe('disabled');
      expect(r.fuel.liveSmokeRunnable).toBe(false);
    });
  });

  // Audit §10 Aufgabe 2: GraphHopper ist Stub → not_implemented + liveSmokeRunnable=false.
  describe('GraphHopper-Stub-Status (Audit §10 Aufgabe 2)', () => {
    it('ROUTING_PROVIDER=graphhopper + NODE_ENV=development → status=not_implemented, liveSmokeRunnable=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'development',
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'graphhopper',
        GRAPHHOPPER_API_KEY: 'gh-real-key-could-be-anything',
      } as NodeJS.ProcessEnv);
      expect(r.routing.status).toBe('not_implemented');
      expect(r.routing.liveSmokeRunnable).toBe(false);
      expect(r.routing.liveVerified).toBe(false);
      expect(r.routing.notes).toBeDefined();
      expect(r.routing.notes!.join(' ')).toMatch(/GraphHopper.*Stub|kein produktiver/i);
    });

    it('GraphHopper meldet auch mit gesetztem API-Key NIE liveSmokeRunnable=true', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'graphhopper',
        GRAPHHOPPER_API_KEY: 'real-graphhopper-key',
      } as NodeJS.ProcessEnv);
      expect(r.routing.liveSmokeRunnable).toBe(false);
    });
  });

  describe('Cost-Controls (Audit §13 + §22 Phase 5)', () => {
    it('liefert Defaults wenn ENV nicht gesetzt', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.costControls.routingMaxCandidates).toBe(10);
      expect(r.costControls.routingConcurrency).toBe(4);
      expect(r.costControls.mapboxCacheTtlSeconds).toBe(1800);
      expect(r.costControls.mapboxTimeoutMs).toBe(4000);
      expect(r.costControls.mapboxDailyRequestLimit).toBe(1000);
      expect(r.costControls.mapboxWarnRequestsPerHour).toBe(200);
    });

    it('respektiert ENV-Overrides', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        ROUTING_MAX_CANDIDATES: '5',
        ROUTING_CONCURRENCY: '2',
        MAPBOX_CACHE_TTL_S: '600',
        MAPBOX_WARN_REQUESTS_PER_HOUR: '500',
      } as NodeJS.ProcessEnv);
      expect(r.costControls.routingMaxCandidates).toBe(5);
      expect(r.costControls.routingConcurrency).toBe(2);
      expect(r.costControls.mapboxCacheTtlSeconds).toBe(600);
      expect(r.costControls.mapboxWarnRequestsPerHour).toBe(500);
    });
  });

  // Audit §22 Phase 8 (PR #11) — Provider-Simulation-Mode.
  describe('Provider-Simulation-Mode (Audit §22 Phase 8)', () => {
    it('default ohne *_PROVIDER_MODE → live, anyMockActive=false', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'pk.realistic-token-1234567890abcdef',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.mode).toBe('live');
      expect(r.routing.mode).toBe('live');
      expect(r.geocoder.mode).toBe('live');
      expect(r.providerSimulation.fuel.status).toBe('live_ready');
      expect(r.providerSimulation.routing.status).toBe('live_ready');
      expect(r.providerSimulation.anyMockActive).toBe(false);
      expect(r.providerSimulation.fuel.liveVerified).toBe(false);
    });

    it('FUEL_PROVIDER_MODE=mock → mode=mock, status=mock_ready, anyMockActive=true', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        FUEL_PROVIDER_MODE: 'mock',
      } as NodeJS.ProcessEnv);
      expect(r.fuel.mode).toBe('mock');
      expect(r.fuel.status).toBe('disabled');
      expect(r.fuel.liveSmokeRunnable).toBe(false);
      expect(r.providerSimulation.fuel.status).toBe('mock_ready');
      expect(r.providerSimulation.fuel.liveVerified).toBe(false);
      expect(r.providerSimulation.anyMockActive).toBe(true);
    });

    it('ROUTING_PROVIDER_MODE=mock → MockRouting wird angezeigt, NIE liveSmokeRunnable=true', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        ROUTING_PROVIDER_MODE: 'mock',
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        MAPBOX_ACCESS_TOKEN: 'pk.real-token-irrelevant',
      } as NodeJS.ProcessEnv);
      expect(r.routing.mode).toBe('mock');
      expect(r.routing.status).toBe('disabled');
      expect(r.routing.liveSmokeRunnable).toBe(false);
      expect(r.providerSimulation.routing.status).toBe('mock_ready');
      expect(r.providerSimulation.routing.liveVerified).toBe(false);
    });

    it('Production + mode=mock ohne ALLOW_MOCK_PROVIDERS_IN_PRODUCTION → status=blocked_in_production', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'production',
        FUEL_PROVIDER_MODE: 'mock',
      } as NodeJS.ProcessEnv);
      // Snapshot-Service selber konstruiert keinen MockProvider — er
      // dokumentiert nur, dass dieser Modus in prod blockiert ist.
      expect(r.providerSimulation.fuel.status).toBe('blocked_in_production');
      expect(r.providerSimulation.allowMockInProduction).toBe(false);
    });

    it('Production + mode=mock + ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true → status=mock_in_production (§4.2)', () => {
      const { svc } = makeSvc();
      const original = process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = 'true';
        process.env.NODE_ENV = 'production';
        const r = svc.snapshot({
          NODE_ENV: 'production',
          FUEL_PROVIDER_MODE: 'mock',
          ALLOW_MOCK_PROVIDERS_IN_PRODUCTION: 'true',
        } as NodeJS.ProcessEnv);
        expect(r.providerSimulation.fuel.status).toBe('mock_in_production');
        expect(r.providerSimulation.allowMockInProduction).toBe(true);
        expect(r.providerSimulation.fuel.runnable).toBe(true);
        expect(r.providerSimulation.fuel.notes.join(' ')).toMatch(/WARNUNG.*Mock.*Production/);
      } finally {
        if (original == null) delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
        else process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = original;
        if (originalEnv == null) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalEnv;
      }
    });

    it('ungueltiger FUEL_PROVIDER_MODE wirft Error', () => {
      const { svc } = makeSvc();
      expect(() =>
        svc.snapshot({
          FUEL_PROVIDER_MODE: 'fantasy',
        } as NodeJS.ProcessEnv),
      ).toThrow(/FUEL_PROVIDER_MODE.*ungueltig.*fantasy/);
    });

    it('alle Adapter melden default-mode auch ohne Konfiguration', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.push.mode).toBe('disabled');
      expect(r.providerSimulation.auth.mode).toBe('disabled');
      expect(r.providerSimulation.payment.mode).toBe('disabled');
      expect(r.providerSimulation.push.liveVerified).toBe(false);
      expect(r.providerSimulation.auth.liveVerified).toBe(false);
      expect(r.providerSimulation.payment.liveVerified).toBe(false);
    });

    it('PUSH_PROVIDER_MODE=mock → push.status=mock_ready', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
        PUSH_PROVIDER_MODE: 'mock',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.push.mode).toBe('mock');
      expect(r.providerSimulation.push.status).toBe('mock_ready');
      expect(r.providerSimulation.anyMockActive).toBe(true);
    });

    // Auftrag §5: ProviderReadiness muss service/provider/configured/runnable/
    // lastLiveStatus enthalten und bei Live-Konfig how-to-configure liefern.
    it('ProviderReadiness traegt service+provider+lastLiveStatus (Auftrags-Vertrag §5)', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.fuel.service).toBe('fuel');
      expect(r.providerSimulation.fuel.provider).toBe('tankerkoenig');
      expect(r.providerSimulation.fuel.lastLiveStatus).toBe('not_checked');
      expect(r.providerSimulation.fuel.configured).toBe(true);
      expect(r.providerSimulation.fuel.runnable).toBe(true);
      expect(r.providerSimulation.fuel.liveVerified).toBe(false);
      expect(Array.isArray(r.providerSimulation.fuel.notes)).toBe(true);
    });

    it('mock-ready: runnable=true, configured=true, liveVerified=false, notes erklaeren Mock', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        FUEL_PROVIDER_MODE: 'mock',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.fuel.status).toBe('mock_ready');
      expect(r.providerSimulation.fuel.runnable).toBe(true);
      expect(r.providerSimulation.fuel.liveVerified).toBe(false);
      expect(r.providerSimulation.fuel.notes.join(' ')).toMatch(/Mock-Daten aktiv/);
    });

    it('missing_config liefert howToConfigure-Hinweise (Auftrag §14.1)', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        ROUTING_ENABLED: 'true',
        ROUTING_PROVIDER: 'mapbox',
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.routing.status).toBe('missing_config');
      expect(r.providerSimulation.routing.missingKeys).toContain('MAPBOX_ACCESS_TOKEN');
      expect(r.providerSimulation.routing.howToConfigure).toBeDefined();
      expect(r.providerSimulation.routing.howToConfigure!.join(' ')).toMatch(
        /MAPBOX_ACCESS_TOKEN|smoke:mapbox:routing/,
      );
    });

    it('disabled-Adapter: runnable=false, missingKeys=[]', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.push.runnable).toBe(false);
      expect(r.providerSimulation.push.missingKeys).toEqual([]);
      expect(r.providerSimulation.push.lastLiveStatus).toBe('not_checked');
    });

    // PR #12 §5.2: Aggregat-Felder.
    it('Aggregate: alle aktiven Adapter Mock → hasOnlyMockOrContractProviders=true', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        FUEL_PROVIDER_MODE: 'mock',
        ROUTING_PROVIDER_MODE: 'mock',
        GEOCODER_PROVIDER_MODE: 'mock',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.anyMockActive).toBe(true);
      expect(r.providerSimulation.anyContractActive).toBe(false);
      expect(r.providerSimulation.hasOnlyMockOrContractProviders).toBe(true);
      expect(r.providerSimulation.hasLiveVerifiedProviders).toBe(false);
    });

    it('Aggregate: anyContractActive=true wenn ein Adapter contract laeuft', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        NODE_ENV: 'test',
        FUEL_PROVIDER_MODE: 'contract',
        ROUTING_PROVIDER_MODE: 'mock',
        GEOCODER_PROVIDER_MODE: 'mock',
      } as NodeJS.ProcessEnv);
      expect(r.providerSimulation.anyContractActive).toBe(true);
      expect(r.providerSimulation.hasOnlyMockOrContractProviders).toBe(true);
    });

    it('providers-Liste enthaelt alle 6 Adapter mit einheitlicher Form (PR #12 §9.1)', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      const services = r.providerSimulation.providers.map((p) => p.service).sort();
      expect(services).toEqual(['auth', 'fuel', 'geocoder', 'payment', 'push', 'routing']);
      for (const p of r.providerSimulation.providers) {
        expect(typeof p.service).toBe('string');
        expect(typeof p.provider).toBe('string');
        expect(typeof p.mode).toBe('string');
        expect(typeof p.status).toBe('string');
        expect(typeof p.configured).toBe('boolean');
        expect(typeof p.runnable).toBe('boolean');
        expect(p.liveVerified).toBe(false); // strukturell heute immer false
        expect(p.lastLiveStatus).toBe('not_checked');
        expect(Array.isArray(p.missingKeys)).toBe(true);
        expect(Array.isArray(p.notes)).toBe(true);
      }
    });

    // PR #12 §5.3: Sentinel-Test fuer 8 Secret-Variablen.
    // Bewusst LOW-ENTROPY-Sentinels — sie muessen eindeutig im JSON
    // wiederfindbar sein, duerfen aber NICHT wie echte Keys aussehen
    // (gitleaks-generic-api-key-Rule schlaegt sonst False Positive an).
    // Pruefung: substring-Match in JSON.stringify(snapshot).
    const broadSentinels: Record<string, string> = {
      TANKERKOENIG_API_KEY: 'unit-test-marker-alpha',
      MAPBOX_ACCESS_TOKEN: 'unit-test-marker-beta',
      FCM_PRIVATE_KEY: 'unit-test-marker-gamma',
      GOOGLE_CLIENT_SECRET: 'unit-test-marker-delta',
      APPLE_SHARED_SECRET: 'unit-test-marker-epsilon',
      STRIPE_SECRET_KEY: 'unit-test-marker-zeta',
      JWT_ACCESS_SECRET: 'unit-test-marker-eta-eta-eta-32',
      COOKIE_SECRET: 'unit-test-marker-theta-theta-32x',
    };
    it.each(Object.entries(broadSentinels))(
      'kein %s-Wert erscheint in JSON.stringify(snapshot) (PR #12 §5.3)',
      (_label, sentinel) => {
        const { svc } = makeSvc();
        const env: Record<string, string> = {
          FUEL_PROVIDER: 'tankerkoenig',
          ROUTING_ENABLED: 'true',
          ROUTING_PROVIDER: 'mapbox',
          GEOCODER_PROVIDER: 'nominatim',
          NOMINATIM_USER_AGENT: 'TankLotse/1.0 test',
          ...broadSentinels,
        };
        const json = JSON.stringify(svc.snapshot(env as NodeJS.ProcessEnv));
        expect(json).not.toContain(sentinel);
      },
    );
  });

  describe('Mapbox-Metrics-Snapshot', () => {
    it('startet bei 0 fuer alle Counter', () => {
      const { svc } = makeSvc();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.mapbox.requestsLastHour).toBe(0);
      expect(r.mapbox.cacheHitRate).toBeNull();
      expect(r.mapbox.timeoutsLastHour).toBe(0);
      expect(r.mapbox.overWarnThreshold).toBe(false);
    });

    it('reflektiert recordRequest / recordCacheHit / recordTimeout', () => {
      const { svc, metrics } = makeSvc();
      metrics.recordRequest();
      metrics.recordRequest();
      metrics.recordCacheHit();
      metrics.recordCacheMiss();
      metrics.recordTimeout();
      const r = svc.snapshot({
        FUEL_PROVIDER: 'tankerkoenig',
        TANKERKOENIG_API_KEY: 'k',
      } as NodeJS.ProcessEnv);
      expect(r.mapbox.requestsLastHour).toBe(2);
      expect(r.mapbox.cacheHitsLastHour).toBe(1);
      expect(r.mapbox.cacheMissesLastHour).toBe(1);
      expect(r.mapbox.cacheHitRate).toBe(0.5);
      expect(r.mapbox.timeoutsLastHour).toBe(1);
    });

    it('overWarnThreshold=true wenn requestsLastHour ≥ MAPBOX_WARN_REQUESTS_PER_HOUR', () => {
      const { svc, metrics } = makeSvc();
      // RoutingMetricsService liest direkt process.env — entsprechend setzen
      // und nach dem Test sauber wieder loeschen.
      const original = process.env.MAPBOX_WARN_REQUESTS_PER_HOUR;
      process.env.MAPBOX_WARN_REQUESTS_PER_HOUR = '5';
      try {
        for (let i = 0; i < 5; i++) metrics.recordRequest();
        const r = svc.snapshot({
          FUEL_PROVIDER: 'tankerkoenig',
          TANKERKOENIG_API_KEY: 'k',
          MAPBOX_WARN_REQUESTS_PER_HOUR: '5',
        } as NodeJS.ProcessEnv);
        expect(r.mapbox.requestsLastHour).toBe(5);
        expect(r.mapbox.overWarnThreshold).toBe(true);
      } finally {
        if (original == null) delete process.env.MAPBOX_WARN_REQUESTS_PER_HOUR;
        else process.env.MAPBOX_WARN_REQUESTS_PER_HOUR = original;
      }
    });
  });
});
