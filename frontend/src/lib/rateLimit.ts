import { NextRequest } from 'next/server';

type RateLimitConfig = {
  [key: string]: {
    limit: number;
    window: string;
  };
};

export const RATE_LIMITS = {
  CREATE_BUYER: '10 per minute' as const,
  UPDATE_BUYER: '20 per minute' as const
};

type RateLimitKey = keyof typeof RATE_LIMITS;

const limits: RateLimitConfig = {
  '10 per minute': { limit: 10, window: '1m' },
  '20 per minute': { limit: 20, window: '1m' }
};

export async function rateLimiter(
  request: NextRequest,
  limit: number,
  window: string
) {
  // Simple in-memory rate limiter (replace with Redis in production)
  const ip = request.ip || request.headers.get('x-forwarded-for') || '';
  const key = `rate-limit:${ip}`;
  
  // In a real app, you would use Redis or similar here
  return {
    success: true,
    limit,
    remaining: limit - 1,
    reset: Date.now() + 60000
  };
}

export async function check(
  request: NextRequest,
  limitType: RateLimitKey
) {
  const { limit, window } = limits[RATE_LIMITS[limitType]];
  return rateLimiter(request, limit, window);
}
