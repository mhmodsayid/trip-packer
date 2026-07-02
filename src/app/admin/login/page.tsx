"use client";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { useTranslation } from "@/components/LanguageProvider";

export default function AdminLoginPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">{t("adminLoginTitle")}</h1>
      <AdminLoginForm />
    </main>
  );
}
