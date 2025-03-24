import 'reflect-metadata';
import mongoose from 'mongoose';
import { app, server } from './app';
import { initWebSocketServer } from './controllers/CryptoPriceController';

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URI = process.env.DATABASE_URI!;

mongoose
  .connect(DATABASE_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    waitQueueTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
  .then(() => {
    console.log('Connected to MongoDB');

    // Initialize WebSocket server after MongoDB connection
    initWebSocketServer(server);

    server.listen(PORT, () => {
      console.log(`Server running on http://192.168.80.27:${PORT}`);
      console.log(`Server also accessible on http://localhost:${PORT}`);
      console.log(`WebSocket server is also running on the same port`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
