"use client";

import { Card } from "./ui";
import { useTranslation } from "@/components/LanguageProvider";

export function ConfigWarning() {
  const { t } = useTranslation();

  return (
    <Card className="border-amber-200 bg-amber-50">
      <h2 className="font-semibold text-amber-900">{t("configTitle")}</h2>
      <p className="mt-2 text-sm text-amber-800">{t("configBody")}</p>
    </Card>
  );
}
