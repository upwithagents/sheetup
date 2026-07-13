import { describe, it, expect } from "vitest";
import { withBasePath } from "./base-path";

// The suite runs without NEXT_PUBLIC_BASE_PATH set, so BASE_PATH is "".
describe("withBasePath", () => {
  it("returns the path unchanged when no basePath is configured", () => {
    expect(withBasePath("/api/documents/x/pdf")).toBe("/api/documents/x/pdf");
  });
});
