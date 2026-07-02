import type { StoredPerson } from "@/types";

function storageKey(tripId: string): string {
  return `trip-packer:person:${tripId}`;
}

export function getStoredPerson(tripId: string): StoredPerson | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(tripId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPerson;
    if (parsed?.id && parsed?.name && parsed?.sessionId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setStoredPerson(tripId: string, person: StoredPerson): void {
  localStorage.setItem(storageKey(tripId), JSON.stringify(person));
}

export function clearStoredPerson(tripId: string): void {
  localStorage.removeItem(storageKey(tripId));
}

export function buildJoinUrl(tripId: string, pin: string): string {
  if (typeof window === "undefined") {
    return `/t/${tripId}/join?pin=${encodeURIComponent(pin)}`;
  }
  const origin = window.location.origin;
  return `${origin}/t/${tripId}/join?pin=${encodeURIComponent(pin)}`;
}
