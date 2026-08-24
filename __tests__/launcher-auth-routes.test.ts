import { GET as callbackGET } from "../app/api/auth/callback/launcher/route";
import { GET as authStatusGET } from "../app/api/launcher/auth-status/route";
import {
  clearLauncherAuthStore,
  saveLauncherAuthToken,
  consumeLauncherAuthRecord,
} from "../lib/launcher-auth-store";

describe("launcher auth routes", () => {
  beforeEach(() => {
    clearLauncherAuthStore();
    process.env.DISCORD_CLIENT_ID = "discord-client-id";
    process.env.DISCORD_CLIENT_SECRET = "discord-client-secret";
    delete process.env.LAUNCHER_DISCORD_REDIRECT_URI;
  });

  afterEach(() => {
    jest.resetAllMocks();
    clearLauncherAuthStore();
    delete process.env.DISCORD_CLIENT_ID;
    delete process.env.DISCORD_CLIENT_SECRET;
    delete process.env.LAUNCHER_DISCORD_REDIRECT_URI;
  });

  test("callback exchanges code and stores token by state", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 604800,
      }),
    });

    const response = await callbackGET(
      new Request(
        "https://laucherfreedrop.shardweb.app/api/auth/callback/launcher?code=oauth-code&state=launcher-state-123"
      )
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Autenticação concluída");
    expect(fetch).toHaveBeenCalledTimes(1);

    const [, options] = (fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(String(options.body)).toContain("code=oauth-code");
    expect(String(options.body)).toContain(
      encodeURIComponent("https://laucherfreedrop.shardweb.app/api/auth/callback/launcher")
    );

    const record = consumeLauncherAuthRecord("launcher-state-123");
    expect(record).toMatchObject({
      state: "launcher-state-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 604800,
    });
  });

  test("callback rejects invalid state before calling Discord", async () => {
    global.fetch = jest.fn();

    const response = await callbackGET(
      new Request(
        "https://laucherfreedrop.shardweb.app/api/auth/callback/launcher?code=oauth-code&state=short"
      )
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Não foi possível concluir a autenticação");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("auth status returns pending with no-store headers when state is not ready", async () => {
    const response = await authStatusGET(
      new Request(
        "https://laucherfreedrop.shardweb.app/api/launcher/auth-status?state=launcher-state-123"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({ status: "pending" });
  });

  test("auth status returns token once and deletes the temporary record", async () => {
    saveLauncherAuthToken({
      state: "launcher-state-123",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 604800,
    });

    const firstResponse = await authStatusGET(
      new Request(
        "https://laucherfreedrop.shardweb.app/api/launcher/auth-status?state=launcher-state-123"
      )
    );

    await expect(firstResponse.json()).resolves.toEqual({
      status: "completed",
      token: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 604800,
      },
    });

    const secondResponse = await authStatusGET(
      new Request(
        "https://laucherfreedrop.shardweb.app/api/launcher/auth-status?state=launcher-state-123"
      )
    );

    await expect(secondResponse.json()).resolves.toEqual({ status: "pending" });
  });
});
