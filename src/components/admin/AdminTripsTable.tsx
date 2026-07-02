"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";
import { Card } from "@/components/ui";
import type { AdminTripSummary } from "@/lib/admin-data";

interface AdminTripsTableProps {
  trips: AdminTripSummary[];
}

export function AdminTripsTable({ trips }: AdminTripsTableProps) {
  const { t, locale } = useTranslation();

  if (trips.length === 0) {
    return (
      <Card>
        <p className="text-muted">{t("adminNoTrips")}</p>
      </Card>
    );
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === "ar" ? "ar" : "en");

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-white shadow-sm sm:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t("adminTripName")}</th>
              <th className="px-4 py-3 font-medium">{t("adminPin")}</th>
              <th className="px-4 py-3 font-medium">{t("adminCreated")}</th>
              <th className="px-4 py-3 font-medium">{t("adminItems")}</th>
              <th className="px-4 py-3 font-medium">{t("adminPeople")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trips.map((trip) => (
              <tr key={trip.id}>
                <td className="px-4 py-3 font-medium">{trip.name}</td>
                <td className="px-4 py-3 font-mono tracking-widest">{trip.pin}</td>
                <td className="px-4 py-3 text-muted">{formatDate(trip.created_at)}</td>
                <td className="px-4 py-3">{trip.item_count}</td>
                <td className="px-4 py-3">{trip.people_count}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/trips/${trip.id}`}
                    className="text-primary hover:underline"
                  >
                    {t("adminView")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 sm:hidden">
        {trips.map((trip) => (
          <li
            key={trip.id}
            className="rounded-xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-foreground">{trip.name}</span>
              <Link
                href={`/admin/trips/${trip.id}`}
                className="shrink-0 text-sm text-primary hover:underline"
              >
                {t("adminView")}
              </Link>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-muted">{t("adminPin")}</dt>
                <dd className="font-mono tracking-widest text-foreground">{trip.pin}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("adminCreated")}</dt>
                <dd className="text-foreground">{formatDate(trip.created_at)}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("adminItems")}</dt>
                <dd className="text-foreground">{trip.item_count}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("adminPeople")}</dt>
                <dd className="text-foreground">{trip.people_count}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
