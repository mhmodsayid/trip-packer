"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";
import { formatError } from "@/lib/errors";
import { Button, Input, Spinner } from "@/components/ui";

interface ChangeNameFormProps {
  currentName: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function ChangeNameForm({
  currentName,
  onSave,
  onCancel,
}: ChangeNameFormProps) {
  const { t, te } = useTranslation();
  const [name, setName] = useState(currentName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentName);
    setError(null);
  }, [currentName]);

  const trimmed = name.trim();
  const unchanged = trimmed === currentName.trim();
  const canSave = trimmed.length > 0 && !unchanged && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(formatError(err, te, "failedRename"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="change-name-input" className="text-sm font-medium">
          {t("yourName")}
        </label>
        <Input
          id="change-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          disabled={submitting}
          autoFocus
          className="mt-1.5"
        />
      </div>

      {error && (
        <p className="animate-toast-in text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={!canSave}>
          {submitting ? <Spinner label={t("loading")} /> : t("save")}
        </Button>
      </div>
    </form>
  );
}
