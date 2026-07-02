"use client";

import { useMemo, useState } from "react";
import type { Item, ItemFilter, Person } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { ItemRow, useItemAnimations } from "@/components/ItemRow";
import { formatError } from "@/lib/errors";
import { visiblePeople } from "@/lib/people";
import { Input, Spinner } from "./ui";

interface ItemListProps {
  items: Item[];
  people: Person[];
  currentPersonId: string;
  isOwner?: boolean;
  onClaim: (itemId: string) => Promise<void>;
  onUnclaim: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onUpdatePrice?: (itemId: string, price: number | null) => Promise<void>;
  onUpdateName?: (itemId: string, name: string) => Promise<void>;
  onClaimMany?: (itemIds: string[]) => Promise<number>;
  loading?: boolean;
}

export function ItemList({
  items,
  people,
  currentPersonId,
  isOwner = false,
  onClaim,
  onUnclaim,
  onDelete,
  onUpdatePrice,
  onUpdateName,
  onClaimMany,
  loading,
}: ItemListProps) {
  const { t, te } = useTranslation();
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [memberFilterId, setMemberFilterId] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const memberFilterActive = memberFilterId !== "";

  const { newIds, justClaimedIds, exitingItems, markExiting } = useItemAnimations(
    items,
    currentPersonId
  );

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    return map;
  }, [people]);

  const memberOptions = useMemo(() => {
    const participants = visiblePeople(people);
    const counts = new Map<string, number>();
    for (const item of items) {
      if (!item.assigned_person_id) continue;
      counts.set(
        item.assigned_person_id,
        (counts.get(item.assigned_person_id) ?? 0) + 1
      );
    }
    return participants
      .map((person) => ({
        id: person.id,
        name: person.name,
        itemCount: counts.get(person.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [people, items]);

  const selectedMemberName = memberFilterId
    ? peopleMap.get(memberFilterId) ?? t("unknown")
    : null;

  const filtered = useMemo(() => {
    let result = items;

    if (memberFilterActive) {
      result = result.filter((i) => i.assigned_person_id === memberFilterId);
    } else if (filter === "unclaimed") {
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
  }, [items, filter, memberFilterActive, memberFilterId, search, currentPersonId]);

  const displayItems = useMemo(() => {
    const ids = new Set(filtered.map((i) => i.id));
    const extras = [...exitingItems.values()].filter((i) => !ids.has(i.id));
    return [...filtered, ...extras];
  }, [filtered, exitingItems]);

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

  async function handleDelete(item: Item) {
    const isCreator =
      item.added_by_person_id !== null &&
      item.added_by_person_id === currentPersonId;
    if (!isCreator && !isOwner) {
      return;
    }
    if (!window.confirm(t("deleteConfirm", { name: item.name }))) {
      return;
    }
    markExiting(item);
    await handleAction(() => onDelete(item.id), item.id);
  }

  async function handleBulkClaim() {
    if (!onClaimMany || selectedIds.size === 0) return;
    setBulkBusy(true);
    setActionError(null);
    try {
      await onClaimMany([...selectedIds]);
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      setActionError(formatError(err, te, "actionFailed"));
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleSelect(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleMemberFilterChange(value: string) {
    setMemberFilterId(value);
    if (value) {
      exitSelectMode();
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

  const canBulkSelect =
    !memberFilterActive && counts.unclaimed > 0 && Boolean(onClaimMany);

  function emptyMessage(): string {
    if (items.length === 0) return t("noItemsYet");
    if (memberFilterActive && selectedMemberName) {
      if (search.trim()) return t("noItemsMatch");
      return t("noItemsAssignedToMember", { name: selectedMemberName });
    }
    return t("noItemsMatch");
  }

  return (
    <div className="space-y-4 animate-section-in">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex flex-wrap gap-1 rounded-xl border border-border bg-white p-1 shadow-sm motion-safe:transition-opacity motion-safe:duration-200 ${
                memberFilterActive ? "pointer-events-none opacity-50" : ""
              }`}
              aria-hidden={memberFilterActive}
            >
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  disabled={memberFilterActive}
                  tabIndex={memberFilterActive ? -1 : 0}
                  className={`rounded-lg px-3 py-2 text-sm font-medium motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                    filter === f.key && !memberFilterActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-slate-50 hover:text-foreground"
                  }`}
                >
                  {filterLabels[f.key]} ({f.count})
                </button>
              ))}
            </div>

            {canBulkSelect && (
              <button
                type="button"
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className={`rounded-lg px-3 py-2 text-sm font-medium motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selectMode
                    ? "bg-slate-900 text-white"
                    : "border border-border bg-white text-muted hover:bg-slate-50 hover:text-foreground"
                }`}
              >
                {selectMode ? t("cancelSelect") : t("selectItems")}
              </button>
            )}
          </div>

          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-sm">
          <label htmlFor="member-filter" className="text-sm font-medium text-foreground">
            {t("filterByMember")}
          </label>
          <select
            id="member-filter"
            value={memberFilterId}
            onChange={(e) => handleMemberFilterChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">{t("allMembers")}</option>
            {memberOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.itemCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="animate-toast-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {selectMode && selectedIds.size > 0 && (
        <div className="animate-toast-in flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium text-foreground">
            {t("selectedCount", { count: selectedIds.size })}
          </span>
          <button
            type="button"
            onClick={handleBulkClaim}
            disabled={bulkBusy}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm motion-safe:transition-transform motion-safe:duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 motion-safe:active:scale-[0.97]"
          >
            {bulkBusy ? <Spinner label={t("loading")} /> : t("claimSelected", { count: selectedIds.size })}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label={t("loading")} className="text-primary" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="animate-section-in rounded-xl border border-dashed border-border bg-white py-12 text-center">
          <p className="text-muted">{emptyMessage()}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {displayItems.map((item, index) => {
            const isMine = item.assigned_person_id === currentPersonId;
            const status = !item.assigned_person_id
              ? "unclaimed"
              : isMine
                ? "mine"
                : "assigned";
            const assigneeName = item.assigned_person_id
              ? peopleMap.get(item.assigned_person_id) ?? t("unknown")
              : null;
            const isCreator =
              item.added_by_person_id !== null &&
              item.added_by_person_id === currentPersonId;
            const canEditPrice = isCreator || isMine || isOwner;
            const canEditName = isCreator || isOwner;
            const canDelete = isCreator || isOwner;
            const busy = actionId === item.id || bulkBusy;
            const isExiting = exitingItems.has(item.id);
            const justClaimed = justClaimedIds.has(item.id);

            return (
              <ItemRow
                key={item.id}
                item={item}
                assigneeName={assigneeName}
                status={status}
                canDelete={canDelete}
                canEditPrice={canEditPrice}
                busy={busy}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                isNew={newIds.has(item.id)}
                isExiting={isExiting}
                justClaimed={justClaimed}
                staggerIndex={index}
                onToggleSelect={() => toggleSelect(item.id)}
                onClaim={() => handleAction(() => onClaim(item.id), item.id)}
                onUnclaim={() => handleAction(() => onUnclaim(item.id), item.id)}
                onDelete={() => handleDelete(item)}
                onUpdatePrice={
                  canEditPrice && onUpdatePrice
                    ? (price) => handleAction(() => onUpdatePrice(item.id, price), item.id)
                    : undefined
                }
                onUpdateName={
                  canEditName && onUpdateName
                    ? (name) => handleAction(() => onUpdateName(item.id, name), item.id)
                    : undefined
                }
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
