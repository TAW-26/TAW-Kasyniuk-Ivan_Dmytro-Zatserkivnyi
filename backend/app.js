const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('API dziala');
});

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
