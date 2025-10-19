const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
const isConfigured = Boolean(uri);

function mapState(state) {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

async function connectDB() {
  if (!isConfigured) {
    console.warn('MONGODB_URI not set. Skipping DB connection.');
    return { configured: false };
  }
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log('MongoDB connected');
    return { configured: true, connected: true };
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw new Error(`Failed to connect to MongoDB: ${err.message}`);
  }
}

function getDbStatus() {
  if (!isConfigured) return 'not-configured';
  return mapState(mongoose.connection.readyState);
}

async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
}

module.exports = { connectDB, disconnectDB, getDbStatus };
