"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/admin/actions";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input, Spinner } from "@/components/ui";

export function AdminLoginForm() {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState(adminLoginAction, null);

  const errorMessage =
    state?.error === "invalidPassword"
      ? t("adminInvalidPassword")
      : state?.error === "notConfigured"
        ? t("adminNotConfigured")
        : null;

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            {t("adminPassword")}
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t("adminPasswordPlaceholder")}
            disabled={pending}
            autoFocus
            className="mt-1"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Spinner label={t("loading")} /> : t("adminLoginButton")}
        </Button>
      </form>
      {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
    </Card>
  );
}
