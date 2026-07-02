import type { Locale } from "./i18n";

export function formatDate(value: string, locale: Locale): string {
  const isoDate = value.slice(0, 10);
  const date = isoDate.length === 10 ? new Date(`${isoDate}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
