import type { NextConfig } from "next";

// Single source of truth for the basePath: the portal proxies /sheetup/* to
// this app, and NEXT_PUBLIC_BASE_PATH lets client/server code prefix raw
// fetch/<a>/<img> URLs that Next does not rewrite automatically.
const BASE_PATH = "/sheetup";

const nextConfig: NextConfig = {
  // tesseract.js spawns worker threads from files inside its package, and
  // better-sqlite3's native addon locates itself via V8 stack traces
  // (broken by webpack's rewritten require calls) — both need to load
  // from node_modules at runtime instead of being bundled.
  serverExternalPackages: ["tesseract.js", "better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Pin the project root: worktree checkouts otherwise make Next infer the
  // outer repo (multiple lockfiles) and write artifacts there.
  turbopack: { root: __dirname },
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
};

export default nextConfig;
