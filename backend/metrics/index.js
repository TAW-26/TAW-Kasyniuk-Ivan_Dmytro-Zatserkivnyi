const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({
  app: 'list-app-backend',
});

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Łączna liczba żądań HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Czas odpowiedzi HTTP w milisekundach',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Liczba aktualnie aktywnych połączeń HTTP',
  registers: [register],
});

const slowRequestsTotal = new client.Counter({
  name: 'slow_requests_total',
  help: 'Liczba żądań HTTP wolniejszych niż próg SLOW_REQUEST_THRESHOLD_MS',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Liczba odpowiedzi błędnych (4xx/5xx) z podziałem na typ',
  labelNames: ['method', 'route', 'status_code', 'error_class'],
  registers: [register],
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDurationMs,
  activeConnections,
  slowRequestsTotal,
  httpErrorsTotal,
};
