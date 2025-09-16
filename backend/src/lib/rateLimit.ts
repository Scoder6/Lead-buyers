import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export const createRateLimiter = (opts: {
  points: number;
  duration: number;
}) => {
  const rateLimiter = new RateLimiterMemory({
    points: opts.points,
    duration: opts.duration,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.ip || req.socket.remoteAddress;
      await rateLimiter.consume(clientId as string);
      next();
    } catch (err) {
      res.status(429).json({ 
        error: 'Too many requests', 
        message: `Please wait ${opts.duration} seconds before trying again` 
      });
    }
  };
};

// Rate limits:
// - 10 creates per minute
// - 20 updates per minute
export const createLimiter = createRateLimiter({ points: 10, duration: 60 });
export const updateLimiter = createRateLimiter({ points: 20, duration: 60 });
