"use client";

import { useMemo, type CSSProperties } from "react";
import type { Item, Payment, Person } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { formatAmount } from "@/lib/format-amount";
import { computeMemberOverview } from "@/lib/settlement";
import { Badge } from "@/components/ui";

interface MembersOverviewProps {
  people: Person[];
  items: Item[];
  payments: Payment[];
  currentPersonId: string;
}

export function MembersOverview({
  people,
  items,
  payments,
  currentPersonId,
}: MembersOverviewProps) {
  const { t, locale } = useTranslation();

  const rows = useMemo(
    () => computeMemberOverview(people, items, payments),
    [people, items, payments]
  );

  return (
    <section className="mb-8 animate-section-in">
      <h2 className="mb-3 text-lg font-semibold">{t("membersTitle")}</h2>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-sm text-muted">
          {t("membersEmpty")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {rows.map((row, index) => {
            const isCurrent = row.personId === currentPersonId;
            return (
              <li
                key={row.personId}
                className={[
                  "border-b border-border/70 px-4 py-3 last:border-b-0",
                  "motion-safe:transition-colors motion-safe:duration-200",
                  isCurrent ? "bg-primary/5" : "hover:bg-slate-50/80",
                ].join(" ")}
                style={
                  index > 0 ? undefined : ({ animationDelay: "40ms" } as CSSProperties)
                }
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{row.personName}</span>
                    {isCurrent && <Badge variant="success">{t("you")}</Badge>}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-muted">{t("memberItems")}</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {row.itemCount}
                      </dd>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-muted">{t("memberPaying")}</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {formatAmount(row.itemsTotal, locale)}
                      </dd>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-muted">{t("memberPayments")}</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {formatAmount(row.paymentsTotal, locale)}
                      </dd>
                    </div>
                    <div className="col-span-2 flex items-baseline gap-1.5 sm:col-span-1">
                      <dt className="text-muted">{t("memberCombinedTotal")}</dt>
                      <dd className="font-semibold tabular-nums text-foreground">
                        {formatAmount(row.combinedTotal, locale)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
