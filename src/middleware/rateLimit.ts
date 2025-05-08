import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: 'Try again after 30 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
