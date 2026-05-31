const { httpRequestsTotal, httpRequestDurationMs, activeConnections } = require('../metrics');

module.exports = function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  activeConnections.inc();

  res.on('finish', () => {
    activeConnections.dec();

    const route = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : req.originalUrl?.split('?')[0] || 'unknown';

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    httpRequestsTotal.inc(labels);
    httpRequestDurationMs.observe(labels, durationMs);
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      activeConnections.dec();
    }
  });

  next();
};
