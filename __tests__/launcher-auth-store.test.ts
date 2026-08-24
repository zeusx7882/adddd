import {
  clearLauncherAuthStore,
  consumeLauncherAuthRecord,
  getLauncherAuthRecord,
  isValidLauncherAuthState,
  saveLauncherAuthToken,
} from "../lib/launcher-auth-store";

describe("launcher auth store", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    clearLauncherAuthStore();
  });

  test("stores launcher tokens with a five-minute ttl", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);

    const record = saveLauncherAuthToken({
      state: "launcher-state-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 604800,
    });

    expect(record).toEqual({
      state: "launcher-state-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 604800,
      createdAt: 1_000,
      expiresAt: 301_000,
    });
  });

  test("cleans up expired records before reading", () => {
    jest.spyOn(Date, "now").mockReturnValue(2_000);
    saveLauncherAuthToken({
      state: "launcher-state-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 604800,
    });

    jest.spyOn(Date, "now").mockReturnValue(302_001);

    expect(getLauncherAuthRecord("launcher-state-123")).toBeNull();
  });

  test("consumes tokens only once", () => {
    saveLauncherAuthToken({
      state: "launcher-state-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 604800,
    });

    const firstRead = consumeLauncherAuthRecord("launcher-state-123");
    const secondRead = consumeLauncherAuthRecord("launcher-state-123");

    expect(firstRead?.accessToken).toBe("access-token");
    expect(secondRead).toBeNull();
  });

  test("validates state format conservatively", () => {
    expect(isValidLauncherAuthState("launcher-state-123")).toBe(true);
    expect(isValidLauncherAuthState("short")).toBe(false);
    expect(isValidLauncherAuthState("launcher state 123")).toBe(false);
  });
});
