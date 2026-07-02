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

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
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
              <td className="px-4 py-3 text-muted">
                {new Date(trip.created_at).toLocaleDateString(locale === "ar" ? "ar" : "en")}
              </td>
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
  );
}
