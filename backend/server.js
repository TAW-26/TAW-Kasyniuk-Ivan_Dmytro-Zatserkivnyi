const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is required');
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_REFRESH_SECRET is required');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI is required');
  process.exit(1);
}

connectDB();

const app = require('./app');
const logger = require('./utils/logger');
const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  logger.fatal(
    {
      event: 'process.uncaughtException',
      timestamp: new Date().toISOString(),
      errorType: err.name,
      err: { message: err.message, stack: err.stack, code: err.code },
    },
    'Uncaught exception',
  );
  setTimeout(() => process.exit(1), 200);
});

process.on('unhandledRejection', (reason) => {
  logger.error(
    {
      event: 'process.unhandledRejection',
      timestamp: new Date().toISOString(),
      errorType: reason?.name || 'UnhandledRejection',
      err: { message: reason?.message, stack: reason?.stack },
    },
    'Unhandled promise rejection',
  );
});

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie: ${PORT}`);
  logger.info({ event: 'server.started', port: PORT, pid: process.pid }, 'HTTP server listening');
});
