"use client";

import { useMemo } from "react";
import type { Item, Payment, Person, Trip } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { formatAmount } from "@/lib/format-amount";
import { formatDate } from "@/lib/format-date";
import { visiblePeople } from "@/lib/people";
import { computeMemberOverview, computeSettlement } from "@/lib/settlement";

interface TripPrintViewProps {
  trip: Trip;
  items: Item[];
  people: Person[];
  payments: Payment[];
}

export function TripPrintView({ trip, items, people, payments }: TripPrintViewProps) {
  const { t, locale, dir } = useTranslation();

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const person of people) map.set(person.id, person.name);
    return map;
  }, [people]);

  const settlement = useMemo(
    () => computeSettlement(people, items, payments),
    [people, items, payments]
  );

  const memberRows = useMemo(
    () => computeMemberOverview(people, items, payments),
    [people, items, payments]
  );

  const itemsByPerson = useMemo(() => {
    const hiddenIds = new Set(
      people.filter((p) => p.is_admin).map((p) => p.id)
    );
    const grouped = new Map<string, Item[]>();
    for (const person of visiblePeople(people)) {
      grouped.set(person.id, []);
    }
    for (const item of items) {
      if (!item.assigned_person_id || hiddenIds.has(item.assigned_person_id)) {
        continue;
      }
      const list = grouped.get(item.assigned_person_id);
      if (list) list.push(item);
    }
    return grouped;
  }, [people, items]);

  function assigneeName(item: Item): string {
    if (!item.assigned_person_id) return t("unclaimed");
    return peopleMap.get(item.assigned_person_id) ?? t("unknown");
  }

  function itemPrice(item: Item): string {
    if (item.price == null) return "—";
    return formatAmount(Number(item.price), locale);
  }

  return (
    <div
      dir={dir}
      className="hidden bg-white text-black print:block"
      aria-hidden="true"
    >
      <div className="mx-auto max-w-3xl px-6 py-8">
        <header className="mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold">{trip.name}</h1>
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            {trip.trip_date && (
              <div>
                <dt className="inline font-medium after:content-[':']">{t("tripDate")}</dt>{" "}
                <dd className="inline">{formatDate(trip.trip_date, locale)}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium after:content-[':']">{t("adminCreated")}</dt>{" "}
              <dd className="inline">{formatDate(trip.created_at, locale)}</dd>
            </div>
            <div>
              <dt className="inline font-medium after:content-[':']">{t("pinLabel")}</dt>{" "}
              <dd className="inline font-mono tracking-widest">{trip.pin}</dd>
            </div>
          </dl>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("packingList")}</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-600">{t("noItemsYet")}</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400 text-start">
                  <th className="py-2 pe-2 font-semibold">{t("adminItemName")}</th>
                  <th className="py-2 px-2 font-semibold">{t("adminQuantity")}</th>
                  <th className="py-2 px-2 font-semibold">{t("adminCategory")}</th>
                  <th className="py-2 px-2 font-semibold">{t("priceLabel")}</th>
                  <th className="py-2 ps-2 font-semibold">{t("printBroughtBy")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2 pe-2">{item.name}</td>
                    <td className="py-2 px-2 tabular-nums">{item.quantity}</td>
                    <td className="py-2 px-2">{item.category ?? "—"}</td>
                    <td className="py-2 px-2 tabular-nums">{itemPrice(item)}</td>
                    <td className="py-2 ps-2">{assigneeName(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("summaryTitle")}</h2>
          <p className="text-sm">
            <span className="font-medium">{t("totalTripCost")}: </span>
            {formatAmount(settlement.totalCost, locale)}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("printPerPerson")}</h2>
          {memberRows.length === 0 ? (
            <p className="text-sm text-gray-600">{t("membersEmpty")}</p>
          ) : (
            <ul className="space-y-4">
              {memberRows.map((row) => {
                const personItems = itemsByPerson.get(row.personId) ?? [];
                return (
                  <li key={row.personId} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold">{row.personName}</h3>
                      <p className="text-sm tabular-nums">
                        {t("memberPaying")}: {formatAmount(row.itemsTotal, locale)}
                      </p>
                    </div>
                    {personItems.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm">
                        {personItems.map((item) => (
                          <li key={item.id} className="flex flex-wrap justify-between gap-2">
                            <span>
                              {item.name}
                              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                            </span>
                            <span className="tabular-nums text-gray-700">
                              {item.price != null
                                ? formatAmount(Number(item.price), locale)
                                : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-600">{t("printNoItemsAssigned")}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
