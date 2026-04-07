require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');

const { testConnection } = require('./config/db');
const { initSocket }     = require('./services/socket.service');
const { errorHandler }   = require('./middleware/error');

const authRoutes    = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const {
  orderRouter, cartRouter, reviewRouter,
  wishlistRouter, categoryRouter, notifRouter, analyticsRouter, chatRouter,
} = require('./routes/index.routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRouter);
app.use('/api/cart',          cartRouter);
app.use('/api/reviews',       reviewRouter);
app.use('/api/wishlist',      wishlistRouter);
app.use('/api/categories',    categoryRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api/chat',          chatRouter);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// Global error handler
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────
initSocket(io);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
testConnection().then(() => {
  server.listen(PORT, () => {
    console.log(` OnStore API running on http://localhost:${PORT}`);
    console.log(` Socket.io ready`);
  });
});
