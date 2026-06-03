const { logError } = require('../utils/errorLogger');

module.exports = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  logError(err, req, status);

  const isProd = process.env.NODE_ENV === 'production';
  const body = { message: err.message || 'Błąd serwera' };
  if (status >= 500 && isProd) body.message = 'Błąd serwera';
  res.status(status).json(body);
};
