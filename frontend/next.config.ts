import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/map-journal",
  async rewrites() {
    return [
      {
        source: "/map-journal-api/:path*",
        destination: "http://127.0.0.1:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
