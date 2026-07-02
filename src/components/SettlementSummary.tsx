"use client";

import { useMemo } from "react";
import type { Item, Payment, Person } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { formatAmount } from "@/lib/format-amount";
import { computeSettlement } from "@/lib/settlement";
import { Card } from "@/components/ui";

interface SettlementSummaryProps {
  people: Person[];
  items: Item[];
  payments: Payment[];
}

export function SettlementSummary({ people, items, payments }: SettlementSummaryProps) {
  const { t, locale } = useTranslation();

  const summary = useMemo(
    () => computeSettlement(people, items, payments),
    [people, items, payments]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="space-y-1">
          <p className="text-sm text-muted">{t("totalTripCost")}</p>
          <p className="text-2xl font-bold">{formatAmount(summary.totalCost, locale)}</p>
        </Card>
        {summary.outstandingItems > 0 && (
          <Card className="space-y-1">
            <p className="text-sm text-muted">{t("outstandingItems")}</p>
            <p className="text-2xl font-bold text-amber-700">
              {formatAmount(summary.outstandingItems, locale)}
            </p>
          </Card>
        )}
        <Card className="space-y-1">
          <p className="text-sm text-muted">{t("equalSplit")}</p>
          <p className="text-2xl font-bold">{formatAmount(summary.fairShare, locale)}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h3 className="font-semibold">{t("paidPerPerson")}</h3>
        {summary.balances.length === 0 ? (
          <p className="text-sm text-muted">{t("adminNoPeople")}</p>
        ) : (
          <ul className="space-y-2">
            {summary.balances.map((row) => (
              <li
                key={row.personId}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">{row.personName}</span>
                <span className="text-muted">
                  {t("paidAmount", { amount: formatAmount(row.paid, locale) })}
                  {" · "}
                  {row.balance > 0.005
                    ? t("isOwed", { amount: formatAmount(row.balance, locale) })
                    : row.balance < -0.005
                      ? t("owesAmount", { amount: formatAmount(-row.balance, locale) })
                      : t("settled")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">{t("whoOwesWhom")}</h3>
        {summary.transfers.length === 0 ? (
          <p className="text-sm text-muted">{t("allSettled")}</p>
        ) : (
          <ul className="space-y-2">
            {summary.transfers.map((tr, i) => (
              <li key={`${tr.fromId}-${tr.toId}-${i}`} className="text-sm">
                {t("personOwesPerson", {
                  from: tr.fromName,
                  to: tr.toName,
                  amount: formatAmount(tr.amount, locale),
                })}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
