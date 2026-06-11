import {
  PROVIDER_MODES,
  assertMockAllowed,
  parseProviderMode,
} from './provider-mode.types';

describe('ProviderMode types & helpers — Audit §22 Phase 8', () => {
  describe('parseProviderMode', () => {
    it('akzeptiert alle 5 erlaubten Modi', () => {
      for (const m of PROVIDER_MODES) {
        expect(parseProviderMode(m, 'live', 'TEST_MODE')).toBe(m);
      }
    });

    it('faellt bei undefined / leerem String auf den Default zurueck', () => {
      expect(parseProviderMode(undefined, 'live', 'TEST_MODE')).toBe('live');
      expect(parseProviderMode('', 'mock', 'TEST_MODE')).toBe('mock');
      expect(parseProviderMode('   ', 'sandbox', 'TEST_MODE')).toBe('sandbox');
    });

    it('wirft bei unbekanntem Wert', () => {
      expect(() => parseProviderMode('fantasy', 'live', 'FUEL_PROVIDER_MODE')).toThrow(
        /FUEL_PROVIDER_MODE.*ungueltig.*fantasy/,
      );
    });
  });

  describe('assertMockAllowed', () => {
    const original = { ...process.env };
    afterEach(() => {
      process.env = { ...original };
    });

    it('NODE_ENV != production → kein Throw', () => {
      process.env.NODE_ENV = 'development';
      expect(() => assertMockAllowed('routing')).not.toThrow();
    });

    it('NODE_ENV=production ohne Allow-Flag → Throw mit Begruendung', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      expect(() => assertMockAllowed('routing')).toThrow(
        /ROUTING_PROVIDER_MODE=mock.*production.*ALLOW_MOCK_PROVIDERS_IN_PRODUCTION/,
      );
    });

    it('NODE_ENV=production + Allow-Flag=true → kein Throw', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = 'true';
      expect(() => assertMockAllowed('fuel')).not.toThrow();
    });

    it('Allow-Flag akzeptiert true / 1 / yes (case-insensitive)', () => {
      process.env.NODE_ENV = 'production';
      for (const v of ['true', 'TRUE', '1', 'yes', 'YES']) {
        process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = v;
        expect(() => assertMockAllowed('fuel')).not.toThrow();
      }
    });

    it('unbekannter Scope → generischer ENV-Key in Fehlermeldung', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
      expect(() => assertMockAllowed('experimental')).toThrow(
        /EXPERIMENTAL_PROVIDER_MODE=mock/,
      );
    });

    // PR #12 §6.2: alle sechs offiziellen Adapter-Scopes muessen in Production
    // ohne Allow-Flag werfen — Wahrheits-Garantie: kein einziger Adapter darf
    // unbewusst Mock-Antworten an echte Nutzer liefern.
    it.each([
      'fuel',
      'routing',
      'geocoder',
      'push',
      'auth',
      'payment',
    ] as const)(
      'production + scope=%s + allow=false → Throw mit dem zugehoerigen ENV-Key (PR #12 §6.2)',
      (scope) => {
        process.env.NODE_ENV = 'production';
        delete process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION;
        const expectedKey = `${scope.toUpperCase()}_PROVIDER_MODE`;
        expect(() => assertMockAllowed(scope)).toThrow(new RegExp(expectedKey));
      },
    );

    it('production + Allow-Flag=true: alle sechs Adapter werfen NICHT mehr (PR #12 §6.2)', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PROVIDERS_IN_PRODUCTION = 'true';
      for (const scope of ['fuel', 'routing', 'geocoder', 'push', 'auth', 'payment'] as const) {
        expect(() => assertMockAllowed(scope)).not.toThrow();
      }
    });
  });
});
