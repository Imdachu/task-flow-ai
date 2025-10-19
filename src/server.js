require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Connect to DB on startup
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});

const shutdown = async () => {
  console.log('Shutting down server...');
  try {
    await disconnectDB();
  } catch {}
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Global handlers to surface uncaught issues and shutdown gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In development, avoid exiting immediately; log and continue so we can inspect state.
  // If running in production, prefer to shutdown to avoid corrupted state.
  if (process.env.NODE_ENV === 'production') {
    try { shutdown(); } catch (err) { console.error('Error during shutdown after unhandledRejection:', err); process.exit(1); }
  } else {
    console.warn('DEV MODE: continuing after unhandledRejection to aid debugging.');
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && (err.stack || err));
  if (process.env.NODE_ENV === 'production') {
    try { shutdown(); } catch (e) { console.error('Error during shutdown after uncaughtException:', e); process.exit(1); }
  } else {
    console.warn('DEV MODE: not exiting on uncaughtException so you can inspect logs.');
  }
});
