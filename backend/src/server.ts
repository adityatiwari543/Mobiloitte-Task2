import http from 'http';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { SocketGateway } from './realtime/socket.js';
import { env } from './config/env.js';

async function bootstrap() {
  const server = http.createServer(app);

  // Initialize Socket.IO real-time gateway
  SocketGateway.initialize(server);

  // Connect to MongoDB with auto-retry
  const initDB = async () => {
    try {
      await connectDB();
      const { seedDatabase } = await import('./scripts/seed.js');
      await seedDatabase();
    } catch (err) {
      console.warn('⚠️ MongoDB connection not ready yet. Retrying in 5s...');
      setTimeout(initDB, 5000);
    }
  };
  await initDB();

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 JobConnect Backend API Running on http://127.0.0.1:${env.PORT}`);
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
