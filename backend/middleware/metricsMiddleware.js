const {
  httpRequestsTotal,
  httpRequestDurationMs,
  activeConnections,
  slowRequestsTotal,
  httpErrorsTotal,
} = require('../metrics');
const logger = require('../utils/logger');
const events = require('../utils/eventsBuffer');

const SLOW_THRESHOLD_MS = Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 500;

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

    if (res.statusCode >= 400) {
      const errorClass = res.statusCode >= 500 ? 'server' : 'client';
      httpErrorsTotal.inc({ ...labels, error_class: errorClass });
    }

    if (durationMs > SLOW_THRESHOLD_MS) {
      slowRequestsTotal.inc(labels);
      const reqLog = req.log || logger;
      reqLog.warn(
        {
          event: 'http.slow',
          timestamp: new Date().toISOString(),
          method: req.method,
          route,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs),
          thresholdMs: SLOW_THRESHOLD_MS,
          requestId: req.id,
        },
        `Slow request: ${req.method} ${route} took ${Math.round(durationMs)}ms`,
      );
      events.push(
        'http.slow',
        { route, method: req.method, durationMs: Math.round(durationMs), statusCode: res.statusCode },
        `Wolne żądanie: ${req.method} ${route} (${Math.round(durationMs)}ms)`,
      );
    }
  });

  res.on('close', () => {
    if (!res.writableEnded) activeConnections.dec();
  });

  next();
};
