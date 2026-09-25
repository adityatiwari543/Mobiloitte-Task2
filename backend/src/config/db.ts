import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<typeof mongoose> {
  // Fix for Windows ISP DNS blocking MongoDB Atlas SRV records (_mongodb._tcp querySrv ECONNREFUSED)
  if (env.MONGO_URI.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch {
      // Ignore if environment forbids custom DNS servers
    }
  }

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: true, // Build compound indexes automatically
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB initial connection failed:', error);
    // Don't kill process immediately in dev mode to allow graceful fallback/diagnostics
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 MongoDB connection closed gracefully.');
}
