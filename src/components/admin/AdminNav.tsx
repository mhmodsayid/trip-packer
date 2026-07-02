"use client";

import Link from "next/link";
import { adminLogoutAction } from "@/app/admin/actions";
import { useTranslation } from "@/components/LanguageProvider";
import { Button } from "@/components/ui";

export function AdminNav() {
  const { t } = useTranslation();

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-lg font-semibold">
          {t("adminDashboard")}
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          {t("goHome")}
        </Link>
      </div>
      <form action={adminLogoutAction}>
        <Button type="submit" variant="secondary" size="sm">
          {t("adminLogout")}
        </Button>
      </form>
    </nav>
  );
}
