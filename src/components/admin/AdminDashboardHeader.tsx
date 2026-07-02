"use client";

import { useTranslation } from "@/components/LanguageProvider";

export function AdminDashboardHeader() {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{t("adminDashboard")}</h1>
      <p className="mt-1 text-sm text-muted">{t("adminAllTrips")}</p>
    </div>
  );
}
