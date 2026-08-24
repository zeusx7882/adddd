export type LauncherAuthRecord = {
  state: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  createdAt: number;
  expiresAt: number;
};

const TTL_MS = 5 * 60 * 1000;
const MIN_STATE_LENGTH = 8;
const MAX_STATE_LENGTH = 200;

declare global {
  var __launcherAuthStore: Map<string, LauncherAuthRecord> | undefined;
}

function getStore(): Map<string, LauncherAuthRecord> {
  if (!globalThis.__launcherAuthStore) {
    globalThis.__launcherAuthStore = new Map<string, LauncherAuthRecord>();
  }

  return globalThis.__launcherAuthStore;
}

function cleanupExpired(now: number = Date.now()): void {
  for (const [state, record] of getStore().entries()) {
    if (record.expiresAt <= now) {
      getStore().delete(state);
    }
  }
}

export function isValidLauncherAuthState(state: string): boolean {
  return (
    state.length >= MIN_STATE_LENGTH &&
    state.length <= MAX_STATE_LENGTH &&
    state.trim() === state &&
    !/\s/.test(state)
  );
}

export function saveLauncherAuthToken(input: {
  state: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): LauncherAuthRecord {
  const now = Date.now();
  cleanupExpired(now);

  const record: LauncherAuthRecord = {
    ...input,
    createdAt: now,
    expiresAt: now + TTL_MS,
  };

  getStore().set(input.state, record);

  return record;
}

export function getLauncherAuthRecord(state: string): LauncherAuthRecord | null {
  cleanupExpired();

  return getStore().get(state) ?? null;
}

export function consumeLauncherAuthRecord(state: string): LauncherAuthRecord | null {
  cleanupExpired();

  const record = getStore().get(state) ?? null;
  if (!record) {
    return null;
  }

  getStore().delete(state);

  return record;
}

export function clearLauncherAuthStore(): void {
  getStore().clear();
}
