import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  test("returns safe process health data", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeSeconds).toBe("number");
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.buildReady).toBe("boolean");
    expect(body).not.toHaveProperty("DATABASE_URL");
  });
});
