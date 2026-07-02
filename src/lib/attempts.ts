const STORAGE_KEY = "trip-packer:join-attempts";
const MAX_ATTEMPTS = 3;
const LOCK_MS = 5 * 60 * 1000;

interface AttemptState {
  count: number;
  lockedUntil: number | null;
}

function readState(): AttemptState {
  if (typeof window === "undefined") {
    return { count: 0, lockedUntil: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as AttemptState;
    if (typeof parsed.count !== "number") return { count: 0, lockedUntil: null };
    return {
      count: parsed.count,
      lockedUntil: typeof parsed.lockedUntil === "number" ? parsed.lockedUntil : null,
    };
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeState(state: AttemptState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function formatLockTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getLockRemainingMs(): number {
  const state = readState();
  if (!state.lockedUntil) return 0;

  const remaining = state.lockedUntil - Date.now();
  if (remaining <= 0) {
    writeState({ count: state.count, lockedUntil: null });
    return 0;
  }

  return remaining;
}

export function isJoinLocked(): boolean {
  return getLockRemainingMs() > 0;
}

export function recordFailure(): void {
  if (isJoinLocked()) return;

  const state = readState();
  const count = state.count + 1;

  if (count >= MAX_ATTEMPTS) {
    writeState({ count: 0, lockedUntil: Date.now() + LOCK_MS });
    return;
  }

  writeState({ count, lockedUntil: null });
}

export function resetAttempts(): void {
  writeState({ count: 0, lockedUntil: null });
}
