"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useTranslation } from "@/components/LanguageProvider";
import { formatError } from "@/lib/errors";
import type { InsertItemsResult } from "@/lib/item-dedupe";
import type { TranslationKey } from "@/lib/i18n";
import { parseBulkText, parseSpreadsheetRows } from "@/lib/parse-items";
import { Button, Card, Input, Spinner, Textarea } from "./ui";

interface AddItemsPanelProps {
  onAddItems: (
    items: { name: string; quantity: number; category: string | null }[]
  ) => Promise<InsertItemsResult>;
  onSuccess?: () => void;
  inModal?: boolean;
}

function bulkResultMessage(
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
  result: InsertItemsResult,
  fileName?: string
): string {
  const { added, skipped } = result;

  if (added === 0 && skipped > 0) {
    return t("allDuplicatesSkipped", { count: skipped });
  }

  if (skipped > 0) {
    if (fileName) {
      return t("importedWithSkipped", { added, skipped, file: fileName });
    }
    return t("addedWithSkipped", { added, skipped });
  }

  if (fileName) {
    return added === 1
      ? t("importedItem", { file: fileName })
      : t("importedItems", { count: added, file: fileName });
  }

  return added === 1 ? t("addedItem") : t("addedItems", { count: added });
}

export function AddItemsPanel({
  onAddItems,
  onSuccess,
  inModal = false,
}: AddItemsPanelProps) {
  const { t, te } = useTranslation();
  const [pasteText, setPasteText] = useState("");
  const [quickName, setQuickName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function showSuccess(text: string) {
    setMessage(text);
    setMessageIsError(false);
  }

  function showError(text: string) {
    setMessage(text);
    setMessageIsError(true);
  }

  async function handlePasteAdd() {
    const parsed = parseBulkText(pasteText);
    if (parsed.length === 0) {
      showError(te("noValidItems"));
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await onAddItems(parsed);
      showSuccess(bulkResultMessage(t, result));
      if (result.added > 0) {
        setPasteText("");
        onSuccess?.();
      }
    } catch (err) {
      showError(formatError(err, te, "failedAddItems"));
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = quickName.trim();
    if (!name) return;

    setLoading(true);
    setMessage(null);
    try {
      const result = await onAddItems([{ name, quantity: 1, category: null }]);
      if (result.added === 0) {
        showError(t("itemAlreadyExists"));
        return;
      }
      setQuickName("");
      showSuccess(t("itemAdded"));
      onSuccess?.();
    } catch (err) {
      showError(formatError(err, te, "failedAddItem"));
    } finally {
      setLoading(false);
    }
  }

  function handlePastePreview() {
    const parsed = parseBulkText(pasteText);
    setPreview({
      count: parsed.length,
      sample: parsed.slice(0, 5).map((p) => {
        const parts = [p.name];
        if (p.quantity > 1) parts.push(`×${p.quantity}`);
        if (p.category) parts.push(`#${p.category}`);
        return parts.join(" ");
      }),
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    setPreview(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const parsed = parseSpreadsheetRows(rows);

      if (parsed.length === 0) {
        showError(te("noValidRows"));
        return;
      }

      setPreview({
        count: parsed.length,
        sample: parsed.slice(0, 5).map((p) => p.name),
      });

      const result = await onAddItems(parsed);
      showSuccess(bulkResultMessage(t, result, file.name));
      if (result.added > 0) {
        onSuccess?.();
      }
    } catch (err) {
      showError(formatError(err, te, "failedImport"));
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const content = (
    <>
      {!inModal && (
        <div>
          <h3 className="font-semibold">{t("addItems")}</h3>
          <p className="mt-1 text-sm text-muted">{t("addItemsHint")}</p>
        </div>
      )}
      {inModal && <p className="text-sm text-muted">{t("addItemsHint")}</p>}

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          placeholder={t("quickAddPlaceholder")}
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          disabled={loading}
          className="min-w-0 flex-1"
        />
        <Button type="submit" disabled={loading || !quickName.trim()} className="shrink-0">
          {t("add")}
        </Button>
      </form>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("pasteList")}</label>
        <Textarea
          placeholder={t("pastePlaceholder")}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          disabled={loading}
          rows={5}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handlePastePreview}
            disabled={loading || !pasteText.trim()}
          >
            {t("preview")}
          </Button>
          <Button onClick={handlePasteAdd} disabled={loading || !pasteText.trim()}>
            {loading ? <Spinner label={t("loading")} /> : t("addFromPaste")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("uploadSpreadsheet")}</label>
        <p className="text-xs text-muted">{t("uploadHint")}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-muted file:me-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
        />
      </div>

      {preview && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium">
            {preview.count === 1
              ? t("itemReady")
              : t("itemsReady", { count: preview.count })}
          </p>
          {preview.sample.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-muted">
              {preview.sample.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {preview.count > preview.sample.length && (
                <li>{t("andMore", { count: preview.count - preview.sample.length })}</li>
              )}
            </ul>
          )}
        </div>
      )}

      {message && (
        <p className={`text-sm ${messageIsError ? "text-red-600" : "text-success"}`}>
          {message}
        </p>
      )}
    </>
  );

  if (inModal) {
    return <div className="space-y-6">{content}</div>;
  }

  return <Card className="space-y-6">{content}</Card>;
}
