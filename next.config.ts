import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js spawns worker threads from files inside its package —
  // bundling breaks those paths, so load it from node_modules at runtime.
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
