import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $queryRaw: mocks.queryRaw },
}));

import { GET } from "@/app/api/ready/route";

describe("GET /api/ready", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset();
  });

  it("returns ready when the database responds", async () => {
    mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 503 without exposing the database error", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("database credentials"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});