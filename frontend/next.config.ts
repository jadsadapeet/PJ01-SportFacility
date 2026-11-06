import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The backend's package-lock.json sits one level up; keep Turbopack rooted here.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
