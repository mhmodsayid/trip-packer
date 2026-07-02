"use client";

import { useTranslation } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  const options: { value: Locale; label: string }[] = [
    { value: "ar", label: t("langArabic") },
    { value: "en", label: t("langEnglish") },
  ];

  return (
    <div
      className={`inline-flex rounded-lg border border-border bg-white p-0.5 shadow-sm ${className}`}
      role="group"
      aria-label={t("switchLanguage")}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            locale === opt.value
              ? "bg-primary text-white"
              : "text-muted hover:bg-slate-50 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-3xl justify-end">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
