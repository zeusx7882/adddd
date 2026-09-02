/**
 * Unit tests for app/api/keys/diagnostics/route.ts
 * Prisma and next-auth are mocked — no real database calls.
 */
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    activationKey: {
      count: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/keys/diagnostics/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedPrisma = prisma as unknown as {
  activationKey: {
    count: jest.Mock;
    findFirst: jest.Mock;
    groupBy: jest.Mock;
  };
};

const ADMIN_SESSION = { user: { discordId: "605278797113327667" } };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_DISCORD_IDS = "605278797113327667";
});

afterEach(() => {
  delete process.env.ADMIN_DISCORD_IDS;
});

describe("GET /api/keys/diagnostics", () => {
  test("returns 401 when not an admin", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test("returns aggregate counts without leaking secrets", async () => {
    mockedGetServerSession.mockResolvedValue(ADMIN_SESSION);
    mockedPrisma.activationKey.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(7) // available
      .mockResolvedValueOnce(3); // used
    mockedPrisma.activationKey.findFirst.mockResolvedValue({
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    mockedPrisma.activationKey.groupBy.mockResolvedValue([
      { appId: "730", gameName: "Counter Strike 2", _count: { id: 10 } },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.table).toBe("activation_keys");
    expect(json.totalKeys).toBe(10);
    expect(json.availableKeys).toBe(7);
    expect(json.usedKeys).toBe(3);
    expect(json.byGame).toEqual([{ appId: "730", gameName: "Counter Strike 2", total: 10 }]);

    const serialized = JSON.stringify(json);
    expect(serialized).not.toMatch(/DATABASE_URL/i);
    expect(serialized).not.toMatch(/postgres(ql)?:\/\//i);
  });
});
