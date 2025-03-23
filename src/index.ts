import 'reflect-metadata';
import mongoose from 'mongoose';
import server from './app';

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URI = process.env.DATABASE_URI!;

mongoose
  .connect(DATABASE_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      // Bind to all interfaces
      console.log(`Server running on http://192.168.80.27:${PORT}`);
      console.log(`Server also accessible on http://localhost:${PORT}`);
      console.log(`WebSocket server is also running on the same port`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
