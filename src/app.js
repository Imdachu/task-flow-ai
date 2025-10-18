const express = require('express');
const cors = require('cors');
const { getDbStatus } = require('./config/db');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Taskboard API is running' });
});

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);

app.get('/health', (req, res) => {
  const db = getDbStatus();
  const healthy = db === 'connected' || db === 'not-configured';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
