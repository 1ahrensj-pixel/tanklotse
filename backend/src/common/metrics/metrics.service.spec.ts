import { MetricsService } from './metrics.service';

describe('MetricsService (§7.2)', () => {
  let svc: MetricsService;

  beforeEach(() => {
    svc = new MetricsService();
    svc.onModuleInit();
  });

  afterEach(() => {
    svc.registry.clear();
  });

  it('normalizePath ersetzt UUIDs durch :uuid', () => {
    expect(svc.normalizePath('/api/stations/6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(
      '/api/stations/:uuid',
    );
  });

  it('normalizePath ersetzt numerische IDs durch :id', () => {
    expect(svc.normalizePath('/api/users/42/orders/7')).toBe('/api/users/:id/orders/:id');
  });

  it('normalizePath strippt Query-String', () => {
    expect(svc.normalizePath('/api/search?lat=50&lng=6')).toBe('/api/search');
  });

  it('http_requests_total inkrementiert mit Labels', async () => {
    svc.httpRequestsTotal.inc({ method: 'GET', path: '/health', status: '200' });
    svc.httpRequestsTotal.inc({ method: 'GET', path: '/health', status: '200' });
    const text = await svc.registry.metrics();
    expect(text).toMatch(/http_requests_total\{method="GET",path="\/health",status="200"\}\s+2/);
  });

  it('http_request_duration_seconds Histogram zeichnet auf', async () => {
    svc.httpRequestDurationSeconds.observe({ method: 'GET', path: '/api' }, 0.05);
    svc.httpRequestDurationSeconds.observe({ method: 'GET', path: '/api' }, 0.15);
    const text = await svc.registry.metrics();
    expect(text).toMatch(/http_request_duration_seconds_bucket\{le="0\.1",method="GET",path="\/api"\}\s+1/);
    expect(text).toMatch(/http_request_duration_seconds_bucket\{le="0\.25",method="GET",path="\/api"\}\s+2/);
  });

  it('external_api_requests_total existiert mit provider+status', async () => {
    svc.externalApiRequestsTotal.inc({ provider: 'tankerkoenig', status: 'success' });
    const text = await svc.registry.metrics();
    expect(text).toMatch(/external_api_requests_total\{provider="tankerkoenig",status="success"\}\s+1/);
  });

  it('Default-Metriken (Node-Prozess) sind enthalten', async () => {
    const text = await svc.registry.metrics();
    // process_resident_memory_bytes oder process_cpu_user_seconds_total sollten enthalten sein.
    expect(text).toMatch(/process_(?:resident_memory_bytes|cpu_user_seconds_total|start_time_seconds)/);
  });

  it('Output ist im Prometheus-text-Format (kein JSON)', async () => {
    svc.httpRequestsTotal.inc({ method: 'POST', path: '/api', status: '201' });
    const text = await svc.registry.metrics();
    expect(text).toMatch(/^# HELP http_requests_total/m);
    expect(text).toMatch(/^# TYPE http_requests_total counter/m);
  });
});
