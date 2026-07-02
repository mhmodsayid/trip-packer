import type { StoredPerson } from "@/types";
import { CANONICAL_HOST } from "./constants";

function storageKey(tripId: string): string {
  return `trip-packer:person:${tripId}`;
}

export function getAppOrigin(): string {
  if (typeof window === "undefined") {
    return `https://${CANONICAL_HOST}`;
  }
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }
  return `https://${CANONICAL_HOST}`;
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
  return `${getAppOrigin()}/t/${tripId}/join?pin=${encodeURIComponent(pin)}`;
}
