import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async check(
    request: NextRequest,
    limit: number,
    config: RateLimitConfig
  ): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const identifier = this.getIdentifier(request);
    const now = Date.now();
    const windowStart = now - config.interval;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    const requestsInWindow = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    const success = requestsInWindow.length < limit;
    
    if (success) {
      // Add current request
      requestsInWindow.push(now);
      this.requests.set(identifier, requestsInWindow);
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }

    return {
      success,
      limit,
      remaining: Math.max(0, limit - requestsInWindow.length),
      reset: windowStart + config.interval,
    };
  }

  private getIdentifier(request: NextRequest): string {
    // Try to get user ID from session, fallback to IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    
    // In a real app, you'd get the user ID from the session
    // For now, we'll use IP address
    return ip;
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = now - (60 * 60 * 1000); // 1 hour ago

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > cutoff);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  CREATE_BUYER: { interval: 60 * 1000, uniqueTokenPerInterval: 10 }, // 10 per minute
  UPDATE_BUYER: { interval: 60 * 1000, uniqueTokenPerInterval: 20 }, // 20 per minute
  IMPORT_CSV: { interval: 60 * 1000, uniqueTokenPerInterval: 2 },   // 2 per minute
} as const;
