import type { NextConfig } from "next";
import { BASE_URL } from "./lib/baseURL";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 100],
  },
  async rewrites() {
    return [
      {
        source: "/api/user/:path*",
        destination: `${BASE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
