import { Test } from '@nestjs/testing';

import { GraphhopperRoutingDistanceService } from './graphhopper-routing-distance.service';
import { MapboxRoutingDistanceService } from './mapbox-routing-distance.service';
import { NoopRoutingDistanceService } from './noop-routing-distance.service';
import { ROUTING_DISTANCE_SERVICE } from './routing-distance.service';
import { RoutingModule } from './routing.module';

/**
 * Audit 2026-05-06 §13 Aufgabe 1: Routing-Module darf bei unbekanntem
 * ROUTING_PROVIDER nicht still auf noop fallen. Tippfehler wie
 * `mapboxx` muessen hart abgewiesen werden, sobald `ROUTING_ENABLED=true`
 * gesetzt ist.
 */
describe('RoutingModule — Provider-Auswahl (Audit §13 Aufgabe 1)', () => {
  async function compile(env: Record<string, string | undefined>) {
    Object.assign(process.env, env);
    return Test.createTestingModule({ imports: [RoutingModule] }).compile();
  }

  beforeEach(() => {
    delete process.env.ROUTING_ENABLED;
    delete process.env.ROUTING_PROVIDER;
    delete process.env.MAPBOX_ACCESS_TOKEN;
    delete process.env.NODE_ENV;
  });

  it('ROUTING_ENABLED=false + ROUTING_PROVIDER=mapboxx → noop ohne Fehler', async () => {
    const mod = await compile({
      ROUTING_ENABLED: 'false',
      ROUTING_PROVIDER: 'mapboxx',
    });
    const svc = mod.get(ROUTING_DISTANCE_SERVICE);
    expect(svc).toBeInstanceOf(NoopRoutingDistanceService);
    await mod.close();
  });

  it('ROUTING_ENABLED=true + ROUTING_PROVIDER=mapboxx → harter Fehler', async () => {
    process.env.ROUTING_ENABLED = 'true';
    process.env.ROUTING_PROVIDER = 'mapboxx';
    await expect(
      Test.createTestingModule({ imports: [RoutingModule] }).compile(),
    ).rejects.toThrow(/ROUTING_PROVIDER ist ungueltig.*mapboxx/);
  });

  it('ROUTING_ENABLED=true + ROUTING_PROVIDER=mapbox + Token → MapboxService', async () => {
    const mod = await compile({
      ROUTING_ENABLED: 'true',
      ROUTING_PROVIDER: 'mapbox',
      MAPBOX_ACCESS_TOKEN: 'pk.realistic-test-token-1234567890abcdef',
    });
    const svc = mod.get(ROUTING_DISTANCE_SERVICE);
    expect(svc).toBeInstanceOf(MapboxRoutingDistanceService);
    await mod.close();
  });

  it('ROUTING_ENABLED=true + ROUTING_PROVIDER=mapbox + Token fehlt → bewusstes Fallback auf noop', async () => {
    const mod = await compile({
      ROUTING_ENABLED: 'true',
      ROUTING_PROVIDER: 'mapbox',
      // kein MAPBOX_ACCESS_TOKEN
    });
    const svc = mod.get(ROUTING_DISTANCE_SERVICE);
    expect(svc).toBeInstanceOf(NoopRoutingDistanceService);
    await mod.close();
  });

  it('ROUTING_ENABLED=true + graphhopper + NODE_ENV=production → harter Fehler', async () => {
    process.env.ROUTING_ENABLED = 'true';
    process.env.ROUTING_PROVIDER = 'graphhopper';
    process.env.NODE_ENV = 'production';
    await expect(
      Test.createTestingModule({ imports: [RoutingModule] }).compile(),
    ).rejects.toThrow(/graphhopper.*production/);
  });

  it('ROUTING_ENABLED=true + graphhopper + NODE_ENV=development → GraphhopperStub', async () => {
    const mod = await compile({
      ROUTING_ENABLED: 'true',
      ROUTING_PROVIDER: 'graphhopper',
      NODE_ENV: 'development',
    });
    const svc = mod.get(ROUTING_DISTANCE_SERVICE);
    expect(svc).toBeInstanceOf(GraphhopperRoutingDistanceService);
    await mod.close();
  });

  it('ROUTING_ENABLED=true + ROUTING_PROVIDER=noop → NoopService', async () => {
    const mod = await compile({
      ROUTING_ENABLED: 'true',
      ROUTING_PROVIDER: 'noop',
    });
    const svc = mod.get(ROUTING_DISTANCE_SERVICE);
    expect(svc).toBeInstanceOf(NoopRoutingDistanceService);
    await mod.close();
  });
});
