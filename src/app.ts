import 'dotenv/config';
require('express-async-errors');
import express from 'express';
import { RegisterRoutes } from '../public/routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJson from '../public/swagger.json';
import cors from 'cors';
import morgan from 'morgan';
import { User } from './models/User';
import { ValidateError } from 'tsoa';
import { AppError } from './utils/customErrors';
import { Types } from 'mongoose';
import { Admin } from './models/Admin';
import { RoleType } from './types';
import multer from 'multer';
import { createServer } from 'http';
import { initWebSocketServer } from './controllers/CryptoPriceController';
import { expressAuthentication } from './middleware/authentication';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

declare global {
  namespace Express {
    interface Request {
      user:
        | (User & { _id: Types.ObjectId; role?: string })
        | (Admin & {
            _id: Types.ObjectId;
            role: RoleType;
          });
    }
  }
}

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(morgan('common'));

app.use(
  '/api/upload',
  (req, res, next) => expressAuthentication(req, 'BearerAuth'),
  upload.single('file'),
);

// Add a simple endpoint to check if the Binance relay is working
app.get('/api/crypto/ping', (req, res) => {
  res.json({ success: true, message: 'Binance relay service is running' });
});

RegisterRoutes(app);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJson));

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err instanceof ValidateError)
      res.status(400).json({
        success: false,
        message: 'Validation Failed',
        errors: err.fields,
      });
    else if (err instanceof AppError)
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    else
      res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
  },
);

// Initialize WebSocket server after Express setup
initWebSocketServer(server);

// Export the HTTP server instead of the Express app
export default server;
