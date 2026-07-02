"use client";

import { useMemo, useState } from "react";
import type { Item, ItemFilter, Person } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { formatError } from "@/lib/errors";
import { Badge, Button, Input, Spinner } from "./ui";

interface ItemListProps {
  items: Item[];
  people: Person[];
  currentPersonId: string;
  onClaim: (itemId: string) => Promise<void>;
  onUnclaim: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  loading?: boolean;
}

export function ItemList({
  items,
  people,
  currentPersonId,
  onClaim,
  onUnclaim,
  onDelete,
  loading,
}: ItemListProps) {
  const { t, te } = useTranslation();
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    return map;
  }, [people]);

  const filtered = useMemo(() => {
    let result = items;

    if (filter === "unclaimed") {
      result = result.filter((i) => !i.assigned_person_id);
    } else if (filter === "mine") {
      result = result.filter((i) => i.assigned_person_id === currentPersonId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.category?.toLowerCase().includes(q) ?? false)
      );
    }

    return result;
  }, [items, filter, search, currentPersonId]);

  const counts = useMemo(() => {
    const unclaimed = items.filter((i) => !i.assigned_person_id).length;
    const mine = items.filter((i) => i.assigned_person_id === currentPersonId).length;
    return { total: items.length, unclaimed, mine };
  }, [items, currentPersonId]);

  async function handleAction(fn: () => Promise<void>, itemId: string) {
    setActionId(itemId);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(formatError(err, te, "actionFailed"));
    } finally {
      setActionId(null);
    }
  }

  const filterLabels: Record<ItemFilter, string> = {
    all: t("filterAll"),
    unclaimed: t("filterUnclaimed"),
    mine: t("filterMine"),
  };

  const filters: { key: ItemFilter; count: number }[] = [
    { key: "all", count: counts.total },
    { key: "unclaimed", count: counts.unclaimed },
    { key: "mine", count: counts.mine },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-white"
                  : "bg-white text-muted border border-border hover:bg-slate-50"
              }`}
            >
              {filterLabels[f.key]} ({f.count})
            </button>
          ))}
        </div>
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label={t("loading")} className="text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-12 text-center">
          <p className="text-muted">
            {items.length === 0 ? t("noItemsYet") : t("noItemsMatch")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-white shadow-sm">
          {filtered.map((item) => {
            const isMine = item.assigned_person_id === currentPersonId;
            const assigneeName = item.assigned_person_id
              ? peopleMap.get(item.assigned_person_id) ?? t("unknown")
              : null;
            const busy = actionId === item.id;

            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.quantity > 1 && (
                      <Badge variant="muted">×{item.quantity}</Badge>
                    )}
                    {item.category && (
                      <Badge variant="default">{item.category}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {!item.assigned_person_id ? (
                      <Badge variant="warning">{t("unclaimed")}</Badge>
                    ) : isMine ? (
                      <Badge variant="success">{t("you")}</Badge>
                    ) : (
                      <span>{assigneeName}</span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {!item.assigned_person_id && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(() => onClaim(item.id), item.id)}
                      disabled={busy}
                    >
                      {busy ? <Spinner label={t("loading")} /> : t("claim")}
                    </Button>
                  )}
                  {isMine && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAction(() => onUnclaim(item.id), item.id)}
                      disabled={busy}
                    >
                      {busy ? <Spinner label={t("loading")} /> : t("unclaim")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(() => onDelete(item.id), item.id)}
                    disabled={busy}
                    className="text-red-600 hover:text-red-700"
                  >
                    {t("delete")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
