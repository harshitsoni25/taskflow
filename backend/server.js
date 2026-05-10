require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (isLocal || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`ProjectHub API running on port ${PORT}`);

    // ── Keep-alive self-ping for Render free tier ──────────────────────────
    // Render free web services sleep after 15 min inactivity.
    // Pinging /api/health every 14 min keeps the server awake 24/7 for free.
    if (process.env.RENDER_EXTERNAL_URL) {
      const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
      setInterval(() => {
        fetch(pingUrl)
          .then(() => console.log(`[keep-alive] pinged ${pingUrl}`))
          .catch(err => console.warn(`[keep-alive] ping failed: ${err.message}`));
      }, 14 * 60 * 1000); // every 14 minutes
      console.log(`[keep-alive] Self-ping enabled → ${pingUrl}`);
    }
  });
}

start().catch(console.error);
