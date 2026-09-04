import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "carrefourbr.vtexassets.com",
      },
    ],
  },
};

export default nextConfig;
