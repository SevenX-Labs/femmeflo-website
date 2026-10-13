import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 100],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    return [
      {
        // Public images, icons & media: cached with stale-while-revalidate for instant performance
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|mp4)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Static font files: immutable long-term caching
        source: "/:all*(woff2|woff|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const rawBackendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "https://femmeflo-inventory.onrender.com/api/v1"
    ).trim().replace(/\/+$/, "");
    const backendUrl = rawBackendUrl.endsWith("/api/v1")
      ? rawBackendUrl
      : `${rawBackendUrl}/api/v1`;

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

};

export default nextConfig;
