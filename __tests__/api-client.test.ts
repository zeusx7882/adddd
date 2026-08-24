/**
 * Unit tests for lib/api-client.ts
 * All network calls are mocked — no real API requests are made.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { checkKey, validateKey } = require("../lib/api-client");

// Helper to mock the global fetch
function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
}

function mockFetchAbort() {
  const err = new Error("The operation was aborted.");
  err.name = "AbortError";
  global.fetch = jest.fn().mockRejectedValueOnce(err);
}

afterEach(() => {
  jest.resetAllMocks();
});

// ─── checkKey ─────────────────────────────────────────────────────────────────

describe("checkKey", () => {
  test("returns error immediately for empty key without calling fetch", async () => {
    global.fetch = jest.fn();
    const result = await checkKey("   ");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Digite uma key válida.");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("trims whitespace before sending", async () => {
    mockFetch(200, { valid: true });
    await checkKey("  MY-KEY  ");
    const call = (fetch as jest.Mock).mock.calls[0];
    const sentBody = JSON.parse(call[1].body as string);
    expect(sentBody.key).toBe("MY-KEY");
  });

  test("returns ok:true on 200 response", async () => {
    mockFetch(200, { valid: true, game: { name: "CS2", appId: "730" } });
    const result = await checkKey("VALID-KEY");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.valid).toBe(true);
    }
  });

  test("returns 404 message on 404 response", async () => {
    mockFetch(404, { error: "not found" });
    const result = await checkKey("MISSING-KEY");
    expect(result.ok).toBe(false);
    expect((result as { status: number }).status).toBe(404);
    expect((result as { message: string }).message).toBe("Key não encontrada.");
  });

  test("returns 400 friendly message", async () => {
    mockFetch(400, { error: "already used" });
    const result = await checkKey("USED-KEY");
    expect(result.ok).toBe(false);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { message: string }).message).toBeTruthy();
  });

  test("returns 500 message on 500 response", async () => {
    mockFetch(500, {});
    const result = await checkKey("SOME-KEY");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Ocorreu um erro no servidor. Tente novamente.");
  });

  test("returns connection error message on network failure", async () => {
    mockFetchNetworkError();
    const result = await checkKey("KEY");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Não foi possível conectar à API. Tente novamente.");
  });

  test("returns connection error message on abort (timeout)", async () => {
    mockFetchAbort();
    const result = await checkKey("KEY");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Não foi possível conectar à API. Tente novamente.");
  });

  test("does NOT call /api/keys/validate", async () => {
    mockFetch(200, { valid: true });
    await checkKey("KEY");
    const call = (fetch as jest.Mock).mock.calls[0];
    expect((call[0] as string)).not.toContain("/validate");
    expect((call[0] as string)).toContain("/check");
  });
});

// ─── validateKey ──────────────────────────────────────────────────────────────

describe("validateKey", () => {
  test("returns error immediately for empty key without calling fetch", async () => {
    global.fetch = jest.fn();
    const result = await validateKey("");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Digite uma key válida.");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("returns ok:true on 200 response", async () => {
    mockFetch(200, { valid: true });
    const result = await validateKey("VALID-KEY");
    expect(result.ok).toBe(true);
  });

  test("calls /api/keys/validate endpoint", async () => {
    mockFetch(200, { valid: true });
    await validateKey("KEY");
    const call = (fetch as jest.Mock).mock.calls[0];
    expect((call[0] as string)).toContain("/validate");
  });

  test("does NOT call /api/keys/check", async () => {
    mockFetch(200, { valid: true });
    await validateKey("KEY");
    const call = (fetch as jest.Mock).mock.calls[0];
    expect((call[0] as string)).not.toContain("/check");
  });

  test("returns 404 message on 404 response", async () => {
    mockFetch(404, {});
    const result = await validateKey("MISSING");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Key não encontrada.");
  });

  test("returns connection error on network failure", async () => {
    mockFetchNetworkError();
    const result = await validateKey("KEY");
    expect(result.ok).toBe(false);
    expect((result as { message: string }).message).toBe("Não foi possível conectar à API. Tente novamente.");
  });
});
