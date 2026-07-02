import type { ParsedItemInput } from "@/types";

function parseQuantity(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function extractCategory(line: string): { text: string; category: string | null } {
  const hashMatch = line.match(/\s+#([^#]+)$/);
  if (hashMatch) {
    return {
      text: line.slice(0, hashMatch.index).trim(),
      category: hashMatch[1].trim() || null,
    };
  }
  return { text: line.trim(), category: null };
}

function parseQuantitySuffix(text: string): { name: string; quantity: number } {
  const xMatch = text.match(/^(.+?)\s+x(\d+)\s*$/i);
  if (xMatch) {
    return { name: xMatch[1].trim(), quantity: parseQuantity(xMatch[2]) };
  }
  const parenMatch = text.match(/^(.+?)\s+\((\d+)\)\s*$/);
  if (parenMatch) {
    return { name: parenMatch[1].trim(), quantity: parseQuantity(parenMatch[2]) };
  }
  return { name: text.trim(), quantity: 1 };
}

export function parseLineItem(line: string): ParsedItemInput | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.includes("\t")) {
    const [name, qty, category] = trimmed.split("\t");
    if (!name?.trim()) return null;
    return {
      name: name.trim(),
      quantity: parseQuantity(qty),
      category: category?.trim() || null,
    };
  }

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    if (!parts[0]) return null;
    return {
      name: parts[0],
      quantity: parseQuantity(parts[1]),
      category: parts[2] || null,
    };
  }

  const { text, category } = extractCategory(trimmed);
  const { name, quantity } = parseQuantitySuffix(text);
  if (!name) return null;
  return { name, quantity, category };
}

export function parseBulkText(text: string): ParsedItemInput[] {
  return text
    .split(/\r?\n/)
    .map(parseLineItem)
    .filter((item): item is ParsedItemInput => item !== null);
}

export function parseSpreadsheetRows(
  rows: Record<string, unknown>[]
): ParsedItemInput[] {
  const items: ParsedItemInput[] = [];

  for (const row of rows) {
    const keys = Object.keys(row);
    const findKey = (target: string) =>
      keys.find((k) => k.toLowerCase().trim() === target);

    const nameKey = findKey("name");
    if (!nameKey) continue;

    const name = String(row[nameKey] ?? "").trim();
    if (!name) continue;

    const qtyKey = findKey("quantity");
    const catKey = findKey("category");

    items.push({
      name,
      quantity: parseQuantity(qtyKey ? String(row[qtyKey]) : undefined),
      category: catKey ? String(row[catKey]).trim() || null : null,
    });
  }

  return items;
}
