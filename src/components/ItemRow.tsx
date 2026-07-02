"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Item } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { Badge, Button, Spinner } from "@/components/ui";

type ItemStatus = "unclaimed" | "mine" | "assigned";

interface ItemRowProps {
  item: Item;
  assigneeName: string | null;
  status: ItemStatus;
  isCreator: boolean;
  busy: boolean;
  selectMode: boolean;
  selected: boolean;
  isNew: boolean;
  isExiting: boolean;
  justClaimed: boolean;
  staggerIndex: number;
  onToggleSelect: () => void;
  onClaim: () => void;
  onUnclaim: () => void;
  onDelete: () => void;
}

const statusStyles: Record<ItemStatus, string> = {
  unclaimed:
    "border-s-[3px] border-s-amber-400 bg-amber-50/60 hover:bg-amber-50",
  mine: "border-s-[3px] border-s-emerald-500 bg-emerald-50/70 hover:bg-emerald-50",
  assigned:
    "border-s-[3px] border-s-slate-300 bg-slate-50/80 hover:bg-slate-50",
};

function StatusIcon({ status }: { status: ItemStatus }) {
  const cls = "h-4 w-4 shrink-0";
  if (status === "unclaimed") {
    return (
      <svg className={`${cls} text-amber-600`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm-2 8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1H4v-1Z" />
      </svg>
    );
  }
  if (status === "mine") {
    return (
      <svg className={`${cls} text-emerald-600`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className={`${cls} text-slate-500`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.097 7.097 0 0 0-13.074 0Z" />
    </svg>
  );
}

export function ItemRow({
  item,
  assigneeName,
  status,
  isCreator,
  busy,
  selectMode,
  selected,
  isNew,
  isExiting,
  justClaimed,
  staggerIndex,
  onToggleSelect,
  onClaim,
  onUnclaim,
  onDelete,
}: ItemRowProps) {
  const { t } = useTranslation();

  const statusLabel =
    status === "unclaimed"
      ? t("unclaimed")
      : status === "mine"
        ? t("you")
        : t("assignedTo", { name: assigneeName ?? t("unknown") });

  const statusBadgeVariant =
    status === "unclaimed" ? "warning" : status === "mine" ? "success" : "muted";

  return (
    <li
      className={[
        "border-b border-border/70 last:border-b-0",
        "motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
        statusStyles[status],
        isNew ? "animate-item-enter" : "",
        isExiting ? "animate-item-exit pointer-events-none" : "",
        justClaimed ? "animate-claim-flash" : "",
        selectMode && selected ? "ring-2 ring-primary/40 ring-inset" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        isNew && !isExiting
          ? ({ animationDelay: `${Math.min(staggerIndex, 8) * 40}ms` } as CSSProperties)
          : undefined
      }
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {selectMode && status === "unclaimed" && (
            <label className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                disabled={busy}
                className="h-5 w-5 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={t("selectItem", { name: item.name })}
              />
            </label>
          )}

          <div className="mt-0.5 shrink-0">
            <StatusIcon status={status} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{item.name}</span>
              {item.quantity > 1 && <Badge variant="muted">×{item.quantity}</Badge>}
              {item.category && <Badge variant="default">{item.category}</Badge>}
            </div>
            <p className="mt-1">
              <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
            </p>
          </div>
        </div>

        {!selectMode && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {status === "unclaimed" && (
              <Button
                size="sm"
                onClick={onClaim}
                disabled={busy}
                className="min-h-11 min-w-[5.5rem] gap-1.5 motion-safe:active:scale-[0.97]"
              >
                {busy ? (
                  <Spinner label={t("loading")} />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                    {t("claim")}
                  </>
                )}
              </Button>
            )}
            {status === "mine" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onUnclaim}
                disabled={busy}
                className="min-h-11 min-w-[5.5rem] motion-safe:active:scale-[0.97]"
              >
                {busy ? <Spinner label={t("loading")} /> : t("unclaim")}
              </Button>
            )}
            {isCreator && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                disabled={busy}
                className="min-h-11 text-red-600 hover:bg-red-50 hover:text-red-700 motion-safe:active:scale-[0.97]"
              >
                {t("delete")}
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function useItemAnimations(items: Item[], currentPersonId: string) {
  const knownIdsRef = useRef<Set<string>>(new Set());
  const prevAssignmentsRef = useRef<Map<string, string | null>>(new Map());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [justClaimedIds, setJustClaimedIds] = useState<Set<string>>(new Set());
  const [exitingItems, setExitingItems] = useState<Map<string, Item>>(new Map());

  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    const added = new Set<string>();

    for (const id of currentIds) {
      if (!knownIdsRef.current.has(id)) added.add(id);
    }

    const claimed = new Set<string>();
    for (const item of items) {
      const prev = prevAssignmentsRef.current.get(item.id);
      if (
        prev !== item.assigned_person_id &&
        item.assigned_person_id === currentPersonId
      ) {
        claimed.add(item.id);
      }
      prevAssignmentsRef.current.set(item.id, item.assigned_person_id);
    }

    knownIdsRef.current = currentIds;

    if (added.size > 0) {
      setNewIds(added);
      const timer = window.setTimeout(() => setNewIds(new Set()), 400);
      return () => window.clearTimeout(timer);
    }

    if (claimed.size > 0) {
      setJustClaimedIds(claimed);
      const timer = window.setTimeout(() => setJustClaimedIds(new Set()), 650);
      return () => window.clearTimeout(timer);
    }
  }, [items, currentPersonId]);

  function markExiting(item: Item) {
    setExitingItems((prev) => new Map(prev).set(item.id, item));
    window.setTimeout(() => {
      setExitingItems((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }, 220);
  }

  return { newIds, justClaimedIds, exitingItems, markExiting };
}
