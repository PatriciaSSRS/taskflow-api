import { MetricsController } from './metrics.controller';
import { registry, httpRequestsTotal } from './metrics.registry';

describe('MetricsController', () => {
  const controller = new MetricsController();

  it('expõe as métricas no formato do Prometheus', async () => {
    httpRequestsTotal.inc({ method: 'GET', route: '/tasks', status_code: '200' });

    const output = await controller.metrics();

    expect(output).toContain('http_requests_total');
    expect(output).toContain('process_resident_memory_bytes');
  });

  it('usa o content-type padrão do registry do prom-client', () => {
    expect(registry.contentType).toContain('text/plain');
  });
});
