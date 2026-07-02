import type { TripHistoryEntry } from "@/types";

const HISTORY_KEY = "trip-packer:history";
const MAX_ENTRIES = 12;

function readRaw(): TripHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is TripHistoryEntry =>
        typeof e?.id === "string" &&
        typeof e?.name === "string" &&
        typeof e?.pin === "string" &&
        typeof e?.personName === "string" &&
        typeof e?.lastVisited === "number"
    );
  } catch {
    return [];
  }
}

function write(entries: TripHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / serialization errors
  }
}

export function getTripHistory(): TripHistoryEntry[] {
  return readRaw().sort((a, b) => b.lastVisited - a.lastVisited);
}

export function recordTripVisit(
  entry: Omit<TripHistoryEntry, "lastVisited">
): void {
  if (typeof window === "undefined") return;
  const others = readRaw().filter((e) => e.id !== entry.id);
  const updated = [{ ...entry, lastVisited: Date.now() }, ...others]
    .sort((a, b) => b.lastVisited - a.lastVisited)
    .slice(0, MAX_ENTRIES);
  write(updated);
}

export function removeTripFromHistory(id: string): void {
  if (typeof window === "undefined") return;
  write(readRaw().filter((e) => e.id !== id));
}
