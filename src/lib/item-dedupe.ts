export type ItemInput = {
  name: string;
  quantity: number;
  category: string | null;
  price?: number | null;
};

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase();
}

export function buildExistingNameSet(items: { name: string }[]): Set<string> {
  return new Set(items.map((item) => normalizeItemName(item.name)));
}

export type FilterNewItemsResult = {
  toInsert: ItemInput[];
  skippedDuplicates: number;
};

export function filterNewItems(
  candidates: ItemInput[],
  existingNames: Set<string>
): FilterNewItemsResult {
  const toInsert: ItemInput[] = [];
  const seenInBatch = new Set<string>();
  let skippedDuplicates = 0;

  for (const item of candidates) {
    const key = normalizeItemName(item.name);
    if (!key) {
      skippedDuplicates++;
      continue;
    }
    if (existingNames.has(key) || seenInBatch.has(key)) {
      skippedDuplicates++;
      continue;
    }
    seenInBatch.add(key);
    toInsert.push(item);
  }

  return { toInsert, skippedDuplicates };
}

export type InsertItemsResult = {
  added: number;
  skipped: number;
};
