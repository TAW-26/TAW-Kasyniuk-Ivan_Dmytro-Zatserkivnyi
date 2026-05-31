const logger = require('../utils/logger');

module.exports = (err, req, res, _next) => {
  const status = err.status || 500;
  const reqLogger = req.log || logger;
  const logPayload = {
    event: 'http.error',
    status,
    method: req.method,
    url: req.originalUrl,
    err: { message: err.message, stack: err.stack, name: err.name },
  };
  if (status >= 500) {
    reqLogger.error(logPayload, 'Unhandled server error');
  } else {
    reqLogger.warn(logPayload, 'Client error');
  }
  res.status(status).json({ message: err.message || 'Błąd serwera' });
};
