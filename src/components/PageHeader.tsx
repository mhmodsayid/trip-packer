"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/components/LanguageProvider";

export function PageHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <Link href="/admin/login" className="text-xs text-muted hover:text-foreground">
          {t("adminLink")}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
