"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/types";

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
