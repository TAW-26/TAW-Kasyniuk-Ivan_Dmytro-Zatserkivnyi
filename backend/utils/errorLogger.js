const logger = require('./logger');
const events = require('./eventsBuffer');

const KNOWN_TYPES = {
  ValidationError: { severity: 'warn', clientFault: true },
  CastError: { severity: 'warn', clientFault: true },
  MongoServerError: { severity: 'error', clientFault: false },
  MongooseServerSelectionError: { severity: 'error', clientFault: false },
  TokenExpiredError: { severity: 'info', clientFault: true },
  JsonWebTokenError: { severity: 'warn', clientFault: true },
  SyntaxError: { severity: 'warn', clientFault: true },
  TypeError: { severity: 'error', clientFault: false },
};

function classify(err, statusCode) {
  const type = err?.name || 'Error';
  const known = KNOWN_TYPES[type];
  if (known) return { type, ...known };
  if (statusCode >= 500) return { type, severity: 'error', clientFault: false };
  if (statusCode >= 400) return { type, severity: 'warn', clientFault: true };
  return { type, severity: 'error', clientFault: false };
}

function buildContext(req) {
  return {
    method: req.method,
    url: req.originalUrl,
    route: req.route?.path,
    params: req.params,
    query: req.query,
    requestId: req.id,
    userId: req.user?.id,
    userAgent: req.headers?.['user-agent'],
    ip: req.ip,
  };
}

function logError(err, req, statusCode = 500) {
  const cls = classify(err, statusCode);
  const reqLog = req.log || logger;
  const payload = {
    event: 'http.error',
    timestamp: new Date().toISOString(),
    statusCode,
    errorType: cls.type,
    severity: cls.severity,
    clientFault: cls.clientFault,
    err: {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    },
    context: buildContext(req),
  };

  if (cls.severity === 'error') reqLog.error(payload, `[${cls.type}] ${err.message}`);
  else if (cls.severity === 'warn') reqLog.warn(payload, `[${cls.type}] ${err.message}`);
  else reqLog.info(payload, `[${cls.type}] ${err.message}`);

  if (cls.severity === 'error' || (statusCode >= 400 && statusCode !== 401 && statusCode !== 404)) {
    events.push(
      'http.error',
      {
        statusCode,
        errorType: cls.type,
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
      },
      `${statusCode} ${cls.type}: ${err.message} (${req.method} ${req.originalUrl})`,
    );
  }

  return payload;
}

module.exports = { logError, classify };
