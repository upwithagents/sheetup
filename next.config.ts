import type { NextConfig } from "next";

// Single source of truth for the basePath: the portal proxies /sheetup/* to
// this app, and NEXT_PUBLIC_BASE_PATH lets client/server code prefix raw
// fetch/<a>/<img> URLs that Next does not rewrite automatically.
const BASE_PATH = "/sheetup";

const nextConfig: NextConfig = {
  // tesseract.js spawns worker threads from files inside its package —
  // bundling breaks those paths, so load it from node_modules at runtime.
  serverExternalPackages: ["tesseract.js"],
  // Pin the project root: worktree checkouts otherwise make Next infer the
  // outer repo (multiple lockfiles) and write artifacts there.
  turbopack: { root: __dirname },
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
};

export default nextConfig;
