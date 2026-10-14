import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp, globalApiRateLimiter } from "./lib/rate-limit";

export function middleware(request: NextRequest) {
  // Only apply rate limiting to /api/* routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const result = globalApiRateLimiter.check(`global:${ip}`);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please wait a few moments before trying again.",
          retryAfter: result.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSec),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
