const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));

const httpLogger = require('./middleware/httpLoggerMiddleware');
app.use(httpLogger);

const { register: metricsRegister } = require('./metrics');
const metricsAuth = require('./middleware/metricsAuthMiddleware');

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  const httpStatus = dbState === 1 ? 200 : 503;
  res.status(httpStatus).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    db: dbStatus,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', metricsAuth, async (req, res, next) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  } catch (err) {
    next(err);
  }
});

const metricsMiddleware = require('./middleware/metricsMiddleware');
app.use(metricsMiddleware);

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const monitoringRoutes = require('./routes/monitoring');

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/monitoring', monitoringRoutes);

const frontendDir = path.resolve(__dirname, '../frontend/dist/frontend/browser');
const frontendIndex = path.join(frontendDir, 'index.html');

if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && req.path !== '/metrics' && req.path !== '/health') {
      return res.sendFile(frontendIndex);
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send('API dziala');
  });
}

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
