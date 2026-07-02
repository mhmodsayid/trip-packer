const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePin(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PIN_CHARS[b % PIN_CHARS.length]).join("");
}

export function normalizePin(pin: string): string {
  return pin.trim().toUpperCase();
}

export function pinsMatch(stored: string, provided: string): boolean {
  return normalizePin(stored) === normalizePin(provided);
}
