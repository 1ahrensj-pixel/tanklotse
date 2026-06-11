import { GraphhopperRoutingDistanceService } from './graphhopper-routing-distance.service';

describe('GraphhopperRoutingDistanceService (Stub)', () => {
  const svc = new GraphhopperRoutingDistanceService();

  it('isPreciseRoutingAvailable() ist immer false (Stub)', () => {
    expect(svc.isPreciseRoutingAvailable()).toBe(false);
  });

  it('calculateExtraDistanceKm() liefert immer precise=false', async () => {
    const r = await svc.calculateExtraDistanceKm();
    expect(r.precise).toBe(false);
    expect(r.reason).toBe('provider_unavailable');
  });
});
