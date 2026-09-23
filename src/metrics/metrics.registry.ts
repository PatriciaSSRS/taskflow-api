import * as client from 'prom-client';

// Registry único do processo. Importado tanto pelo middleware (que
// escreve) quanto pelo controller (que serve o scrape) para os dois
// lados enxergarem os mesmos contadores.
export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP processadas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});
