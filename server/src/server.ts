import http from 'http';
import app from './app';
import connectDB from './config/db';
import { initSocket } from './config/socket';
import { setupLocationSocket } from './sockets/location.socket';
import { setupNotificationSocket } from './sockets/notification.socket';
import { ensureSuperAdmin } from './seeds/seed';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Ensure Super Admin exists
  await ensureSuperAdmin();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.io
  const io = initSocket(httpServer);

  // Setup socket handlers
  setupLocationSocket(io);
  setupNotificationSocket(io);

  // Start listening
  httpServer.listen(PORT, () => {
    console.log(`
    ================================================
    🚑 Emergex Server running on port ${PORT}
    📡 Socket.io initialized
    🔗 API: http://localhost:${PORT}/api
    ================================================
    `);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
