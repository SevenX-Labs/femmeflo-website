/**
 * Femmeflo Frontend In-Memory Sliding-Window Rate Limiter
 * Built for high-reliability Edge & Node.js Next.js route protection.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSec: number;
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  public readonly limit: number;
  public readonly windowMs: number;

  constructor(options: { limit: number; windowMs: number }) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;

    // Periodically prune expired entries
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.cleanup(), 60 * 1000);
      if (typeof timer === "object" && "unref" in timer && typeof timer.unref === "function") {
        timer.unref();
      }
    }
  }

  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now >= record.resetTime) {
      // Window has reset or first request
      const resetTime = now + this.windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        success: true,
        limit: this.limit,
        remaining: Math.max(0, this.limit - 1),
        reset: Math.ceil(resetTime / 1000),
        retryAfterSec: 0,
      };
    }

    if (record.count < this.limit) {
      record.count += 1;
      return {
        success: true,
        limit: this.limit,
        remaining: Math.max(0, this.limit - record.count),
        reset: Math.ceil(record.resetTime / 1000),
        retryAfterSec: 0,
      };
    }

    // Limit breached
    const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: false,
      limit: this.limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
      retryAfterSec,
    };
  }

  public reset(identifier: string): void {
    this.store.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Extracts normalized client IP from request headers
 */
export function getClientIp(req: Request | Headers): string {
  const headers = req instanceof Request ? req.headers : req;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}

// Global pre-configured instances for Next.js routes
export const globalApiRateLimiter = new InMemoryRateLimiter({
  limit: 60, // 60 requests per minute
  windowMs: 60 * 1000,
});

export const contactFormRateLimiter = new InMemoryRateLimiter({
  limit: 5, // 5 inquiries per 10 minutes
  windowMs: 10 * 60 * 1000,
});

export const chatAssistantRateLimiter = new InMemoryRateLimiter({
  limit: 20, // 20 chat messages per 5 minutes
  windowMs: 5 * 60 * 1000,
});
