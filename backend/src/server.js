require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const pool       = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes        = require('./routes/auth.routes');
const userRoutes        = require('./routes/users.routes');
const supplierRoutes    = require('./routes/supplier.routes');
const requisitionRoutes = require('./routes/requisition.routes');
const poRoutes          = require('./routes/purchaseOrder.routes');
const inventoryRoutes   = require('./routes/inventory.routes');
const hrRoutes          = require('./routes/hr.routes');
const financeRoutes     = require('./routes/finance.routes');
const reportsRoutes     = require('./routes/reports.routes');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));

// Health check — used by Docker and Railway
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime(), version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'ProcureEase API', version: '1.0.0', env: process.env.NODE_ENV });
});

app.use('/api/auth',             authRoutes);
app.use('/api/users',            userRoutes);
app.use('/api/suppliers',        supplierRoutes);
app.use('/api/requisitions',     requisitionRoutes);
app.use('/api/purchase-orders',  poRoutes);
app.use('/api/inventory',        inventoryRoutes);
app.use('/api/hr',               hrRoutes);
app.use('/api/finance',          financeRoutes);
app.use('/api/reports',          reportsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`[ProcureEase] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    pool.end();
    console.log('Server shut down gracefully');
  });
});
