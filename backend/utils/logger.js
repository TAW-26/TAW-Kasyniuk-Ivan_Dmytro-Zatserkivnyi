const path = require('path');
const fs = require('fs');
const pino = require('pino');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const fileTransport = {
  target: 'pino-roll',
  options: {
    file: path.join(LOG_DIR, 'app'),
    frequency: 'daily',
    extension: '.log',
    mkdir: true,
    size: '20m',
  },
  level,
};

const prettyTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:HH:MM:ss.l',
    ignore: 'pid,hostname',
    singleLine: false,
  },
  level,
};

const transports =
  isProd || isTest
    ? { target: 'pino/file', options: { destination: 1 } }
    : {
        targets: [fileTransport, prettyTransport],
      };

const logger = pino({
  level,
  base: { app: 'list-app-backend' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: transports,
});

logger.info({ logDir: LOG_DIR, level, env: process.env.NODE_ENV || 'development' }, 'Logger initialized');

module.exports = logger;
