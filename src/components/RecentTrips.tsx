"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";
import { Card } from "@/components/ui";
import { getTripHistory, removeTripFromHistory } from "@/lib/trip-history";
import type { TripHistoryEntry } from "@/types";

export function RecentTrips() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TripHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(getTripHistory());
    setReady(true);
  }, []);

  function openTrip(entry: TripHistoryEntry) {
    router.push(`/t/${entry.id}/join?pin=${encodeURIComponent(entry.pin)}`);
  }

  function remove(id: string) {
    removeTripFromHistory(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (!ready || entries.length === 0) return null;

  return (
    <Card className="mb-6">
      <h2 className="font-semibold">{t("recentTrips")}</h2>
      <ul className="mt-4 space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-white p-2 shadow-sm motion-safe:transition-colors hover:bg-slate-50"
          >
            <button
              type="button"
              onClick={() => openTrip(entry)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base">
                🎒
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  {entry.name}
                </span>
                <span className="block truncate text-sm text-muted">
                  {t("recentTripsAs", { name: entry.personName })}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label={t("removeFromHistory", { name: entry.name })}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted motion-safe:transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
