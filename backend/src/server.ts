import http from 'http';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { SocketGateway } from './realtime/socket.js';
import { env } from './config/env.js';

async function bootstrap() {
  const server = http.createServer(app);

  // Initialize Socket.IO real-time gateway
  SocketGateway.initialize(server);

  // Connect to MongoDB
  try {
    await connectDB();
    // Auto-seed initial demo jobs if database is empty
    const { seedDatabase } = await import('./scripts/seed.js');
    await seedDatabase();
  } catch (err) {
    console.warn('⚠️ Starting HTTP server without immediate MongoDB connection (reconnecting in background)...');
  }

  server.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 JobConnect Backend API Running on http://localhost:${env.PORT}`);
    console.log(`📡 Socket.IO Real-Time Gateway Active`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`======================================================\n`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Gracefully shutting down JobConnect Server...');
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
