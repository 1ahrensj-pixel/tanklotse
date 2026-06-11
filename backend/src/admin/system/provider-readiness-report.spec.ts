import {
  PROVIDERS_CHECK_EXIT_CODES,
  renderProviderReadinessReport,
} from './provider-readiness-report';

/**
 * Audit §22 Phase 8 (PR #11) §16 Aufgabe 12 + PR #12 §6.1 §3.2 —
 * providers:check CLI meldet fehlende Keys korrekt mit definierten
 * Exit-Codes:
 *
 *   0  ok / mock-ready / contract-ready / sandbox-ready / live-ready / disabled
 *   1  missing_config
 *   2  invalid_config (Parse-Fehler)
 *   3  blocked_in_production
 *   4  not_implemented oder mock_in_production (warnender Zustand)
 */
describe('renderProviderReadinessReport — providers:check CLI', () => {
  it('Default-Dev-Konfig ohne Keys → exitCode=1 missing_config', () => {
    const r = renderProviderReadinessReport({
      NODE_ENV: 'development',
    } as NodeJS.ProcessEnv);
    expect(r.exitCode).toBe(PROVIDERS_CHECK_EXIT_CODES.missing_config);
    expect(r.output).toMatch(/\[MISS\] fuel/);
    expect(r.output).toMatch(/TANKERKOENIG_API_KEY/);
    expect(r.output).toMatch(/Setze TANKERKOENIG_API_KEY/);
  });

  it('alles Mock → exitCode=0, alle wichtigen Adapter mock_ready', () => {
    const r = renderProviderReadinessReport({
      NODE_ENV: 'test',
      FUEL_PROVIDER_MODE: 'mock',
      ROUTING_PROVIDER_MODE: 'mock',
      GEOCODER_PROVIDER_MODE: 'mock',
    } as NodeJS.ProcessEnv);
    expect(r.exitCode).toBe(PROVIDERS_CHECK_EXIT_CODES.ok);
    expect(r.output).toMatch(/mode=mock\s+status=mock_ready/);
    expect(r.output).not.toMatch(/\[MISS\]/);
    expect(r.output).toMatch(/anyMockActive=true/);
  });

  it('ROUTING_PROVIDER_MODE=live ohne MAPBOX_ACCESS_TOKEN → missing_config + Exit 1', () => {
    const r = renderProviderReadinessReport({
      NODE_ENV: 'development',
      FUEL_PROVIDER: 'tankerkoenig',
      TANKERKOENIG_API_KEY: 'test',
      ROUTING_PROVIDER_MODE: 'live',
      ROUTING_ENABLED: 'true',
      ROUTING_PROVIDER: 'mapbox',
      NOMINATIM_USER_AGENT: 'TankLotse/1.0',
    } as NodeJS.ProcessEnv);
    expect(r.exitCode).toBe(PROVIDERS_CHECK_EXIT_CODES.missing_config);
    expect(r.output).toMatch(/\[MISS\] routing.*MAPBOX_ACCESS_TOKEN/);
  });

  it('Production + Mock ohne Allow-Flag → exitCode=3 blocked_in_production', () => {
    const r = renderProviderReadinessReport({
      NODE_ENV: 'production',
      FUEL_PROVIDER_MODE: 'mock',
    } as NodeJS.ProcessEnv);
    expect(r.exitCode).toBe(PROVIDERS_CHECK_EXIT_CODES.blocked_in_production);
    expect(r.output).toMatch(/\[BLK\s*\] fuel/);
    expect(r.output).toMatch(/blocked_in_production/);
  });

  it('Production + Mock + ALLOW_MOCK_PROVIDERS_IN_PRODUCTION=true → exitCode=4 (warning mock_in_production)', () => {
    const r = renderProviderReadinessReport({
      NODE_ENV: 'production',
      FUEL_PROVIDER_MODE: 'mock',
      ALLOW_MOCK_PROVIDERS_IN_PRODUCTION: 'true',
    } as NodeJS.ProcessEnv);
    expect(r.exitCode).toBe(PROVIDERS_CHECK_EXIT_CODES.warning);
    expect(r.output).toMatch(/mock_in_production/);
    expect(r.output).toMatch(/WARN/);
  });

  it('ungueltiger ProviderMode → exitCode=2 invalid_config', () => {
    const r = renderProviderReadinessReport({
      FUEL_PROVIDER_MODE: 'fantasy',
    } as NodeJS.ProcessEnv);
    expect(r.exitCode).toBe(PROVIDERS_CHECK_EXIT_CODES.invalid_config);
    expect(r.output).toMatch(/invalid_config/);
    expect(r.output).toMatch(/FUEL_PROVIDER_MODE.*fantasy/);
  });

  it('Output zeigt Wahrheits-Sentence "mock_ready != live_ready"', () => {
    const r = renderProviderReadinessReport({} as NodeJS.ProcessEnv);
    expect(r.output).toMatch(/mock_ready != live_ready/);
    expect(r.output).toMatch(/contract_ready != live_verified/);
  });

  // PR #12 §3.2 / §5.3 — keine Secret-Werte in der CLI-Ausgabe.
  it('CLI-Ausgabe enthaelt KEINE Secret-Werte (Sentinel)', () => {
    const sentinelTk = 'sentinel-tankerkoenig-XYZ-1234567890';
    const sentinelMb = 'sentinel-mapbox-XYZ-1234567890';
    const sentinelJwt = 'sentinel-jwt-32-chars-abc-XYZ-789';
    const r = renderProviderReadinessReport({
      NODE_ENV: 'development',
      FUEL_PROVIDER: 'tankerkoenig',
      TANKERKOENIG_API_KEY: sentinelTk,
      ROUTING_PROVIDER: 'mapbox',
      ROUTING_ENABLED: 'true',
      MAPBOX_ACCESS_TOKEN: sentinelMb,
      JWT_ACCESS_SECRET: sentinelJwt,
    } as NodeJS.ProcessEnv);
    expect(r.output).not.toContain(sentinelTk);
    expect(r.output).not.toContain(sentinelMb);
    expect(r.output).not.toContain(sentinelJwt);
  });

  // PR #12 §3.2 — Mock/Contract gibt nie liveVerified=true aus.
  it('Mock-Modus zeigt liveVerified=false in der CLI-Zeile', () => {
    const r = renderProviderReadinessReport({
      NODE_ENV: 'test',
      FUEL_PROVIDER_MODE: 'mock',
      ROUTING_PROVIDER_MODE: 'contract',
    } as NodeJS.ProcessEnv);
    expect(r.output).toMatch(/fuel\s+mode=mock\s+.*liveVerified=false/);
    expect(r.output).toMatch(/routing\s+mode=contract\s+.*liveVerified=false/);
    expect(r.output).not.toMatch(/liveVerified=true/);
  });
});
