import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Built dynamically so this file's own source doesn't contain the
// forbidden `from "..."` sequences it scans for.
const FORBIDDEN = ["next", "react", "@prisma", "@/lib", "../lib"].map(
  (m) => new RegExp(`from "${m.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}`)
);

function coreFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? coreFiles(join(dir, e.name)) : e.name.endsWith(".ts") ? [join(dir, e.name)] : []
  );
}

describe("core module isolation", () => {
  it("imports no framework or db code", () => {
    for (const file of coreFiles("src/core")) {
      const src = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) expect(src, `${file} violates ${pattern}`).not.toMatch(pattern);
    }
  });
});
