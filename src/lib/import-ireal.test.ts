import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { importIReal } from "./import-ireal";
import { IRealParseError } from "@/core/ireal";
import { parseContent } from "@/core/content";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../core/ireal/fixtures", `${name}.txt`), "utf8");

const client = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./data/test.db" }),
});

beforeEach(async () => {
  await client.document.deleteMany();
  await client.project.deleteMany();
});

afterAll(async () => {
  await client.$disconnect();
});

describe("importIReal", () => {
  it("imports a single song into a new project", async () => {
    const result = await importIReal(fixture("tiny"), "Test Band", client);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].title).toBe("T");

    const doc = await client.document.findUniqueOrThrow({
      where: { id: result.documents[0].id },
      include: { project: true },
    });
    expect(doc.project.name).toBe("Test Band");
    expect(doc.kind).toBe("music");
    expect(doc.sourceFormat).toBe("ireal");
    expect(doc.sourceFileRef).toBe(fixture("tiny"));
    expect(doc.sourceText).toContain("|T34");
    expect(parseContent(doc.content).sections).toHaveLength(1);
  });

  it("reuses an existing project by name", async () => {
    const first = await importIReal(fixture("tiny"), "Test Band", client);
    const second = await importIReal(fixture("twoSongsInHTML"), "Test Band", client);
    expect(second.projectId).toBe(first.projectId);
    expect(await client.project.count()).toBe(1);
  });

  it("imports a whole playlist as one document per song", async () => {
    const result = await importIReal(fixture("django"), "Jazz", client);
    expect(result.documents).toHaveLength(205);
    expect(await client.document.count()).toBe(205);
  });

  it("rejects input without an ireal link", async () => {
    await expect(importIReal("total garbage", "X", client)).rejects.toThrow(IRealParseError);
    expect(await client.project.count()).toBe(0);
  });
});
