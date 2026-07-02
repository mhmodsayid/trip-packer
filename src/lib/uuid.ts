const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function extractTripIdFromJoinInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (isValidUuid(trimmed)) return trimmed;

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, "http://local");
    const match = url.pathname.match(/\/t\/([0-9a-f-]{36})\/join/i);
    if (match && isValidUuid(match[1])) return match[1];
  } catch {
    const pathMatch = trimmed.match(/\/t\/([0-9a-f-]{36})(?:\/join)?/i);
    if (pathMatch && isValidUuid(pathMatch[1])) return pathMatch[1];
  }

  return null;
}
