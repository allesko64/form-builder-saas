import type { NextConfig } from "next";

const authServerUrl = process.env.AUTH_SERVER_URL ?? process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${authServerUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
