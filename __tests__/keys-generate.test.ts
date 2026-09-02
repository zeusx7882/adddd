/**
 * Unit tests for app/api/keys/generate/route.ts
 * Prisma and next-auth are mocked — no real database or network calls.
 */
import { NextRequest } from "next/server";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findUnique: jest.fn() },
    activationKey: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/keys/generate/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const mockedPrisma = prisma as unknown as {
  game: { findUnique: jest.Mock };
  activationKey: { findMany: jest.Mock; createMany: jest.Mock };
  auditLog: { create: jest.Mock };
  $transaction: jest.Mock;
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/keys/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const ADMIN_SESSION = {
  user: { discordId: "605278797113327667", name: "Admin" },
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_DISCORD_IDS = "605278797113327667";
});

afterEach(() => {
  delete process.env.ADMIN_DISCORD_IDS;
});

describe("POST /api/keys/generate", () => {
  test("returns 401 when not an admin", async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ gameId: "game1", quantity: 1 }));
    expect(res.status).toBe(401);
  });

  test("returns 404 when game does not exist", async () => {
    mockedGetServerSession.mockResolvedValue(ADMIN_SESSION);
    mockedPrisma.game.findUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ gameId: "missing", quantity: 1 }));
    expect(res.status).toBe(404);
  });

  test("persists keys trimmed/uppercased with appId as string, used=false, usedBy=null, usedAt=null", async () => {
    mockedGetServerSession.mockResolvedValue(ADMIN_SESSION);
    mockedPrisma.game.findUnique.mockResolvedValue({
      id: "game1",
      name: "Counter Strike 2",
      appId: 730, // simulate a non-string appId coming from the DB layer
    });
    mockedPrisma.activationKey.findMany.mockResolvedValue([]);

    let createdData: Array<{ key: string; appId: string; gameName: string }> = [];
    mockedPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        activationKey: {
          createMany: jest.fn(async ({ data }) => {
            createdData = data;
            return { count: data.length };
          }),
          findMany: jest.fn(async () =>
            createdData.map((entry, index) => ({
              id: `key-${index}`,
              key: entry.key,
              appId: entry.appId,
              gameName: entry.gameName,
              used: false,
              usedBy: null,
              usedAt: null,
              createdAt: new Date(),
            }))
          ),
        },
      };
      return callback(tx);
    });

    const res = await POST(makeRequest({ gameId: "game1", quantity: 3 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.generated).toBe(3);
    expect(json.keys).toHaveLength(3);

    for (const key of json.keys as string[]) {
      expect(key).toBe(key.trim().toUpperCase());
    }

    expect(createdData).toHaveLength(3);
    for (const entry of createdData) {
      expect(entry.key).toBe(entry.key.trim().toUpperCase());
      expect(typeof entry.appId).toBe("string");
      expect(entry.appId).toBe("730");
      expect(entry.gameName).toBe("Counter Strike 2");
    }

    for (const record of json.records) {
      expect(record.used).toBe(false);
      expect(record.usedBy).toBeNull();
      expect(record.usedAt).toBeNull();
      expect(typeof record.appId).toBe("string");
    }
  });

  test("rejects invalid quantity", async () => {
    mockedGetServerSession.mockResolvedValue(ADMIN_SESSION);
    const res = await POST(makeRequest({ gameId: "game1", quantity: 0 }));
    expect(res.status).toBe(400);
  });
});
