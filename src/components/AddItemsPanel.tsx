"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { parseBulkText, parseSpreadsheetRows } from "@/lib/parse-items";
import { Button, Card, Input, Spinner, Textarea } from "./ui";

interface AddItemsPanelProps {
  onAddItems: (
    items: { name: string; quantity: number; category: string | null }[]
  ) => Promise<number>;
}

export function AddItemsPanel({ onAddItems }: AddItemsPanelProps) {
  const [pasteText, setPasteText] = useState("");
  const [quickName, setQuickName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePasteAdd() {
    const parsed = parseBulkText(pasteText);
    if (parsed.length === 0) {
      setMessage("No valid items found. Check the format.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const count = await onAddItems(parsed);
      setMessage(`Added ${count} item${count === 1 ? "" : "s"}.`);
      setPasteText("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add items.");
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
      await onAddItems([{ name, quantity: 1, category: null }]);
      setQuickName("");
      setMessage("Item added.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add item.");
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
        setMessage("No valid rows found. Expected columns: name, quantity, category.");
        return;
      }

      setPreview({
        count: parsed.length,
        sample: parsed.slice(0, 5).map((p) => p.name),
      });

      const count = await onAddItems(parsed);
      setMessage(`Imported ${count} item${count === 1 ? "" : "s"} from ${file.name}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to import file.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="font-semibold">Add items</h3>
        <p className="mt-1 text-sm text-muted">
          Paste a list, upload a spreadsheet, or quick-add one item.
        </p>
      </div>

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          placeholder="Quick add an item..."
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !quickName.trim()}>
          Add
        </Button>
      </form>

      <div className="space-y-2">
        <label className="text-sm font-medium">Paste list</label>
        <Textarea
          placeholder={`One item per line. Formats:\n• Tent\n• Sleeping bag x2\n• Headlamp #gear\n• Water bottle, 3, drinks\n• Snacks\t2\tfood`}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          disabled={loading}
          rows={5}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handlePastePreview}
            disabled={loading || !pasteText.trim()}
          >
            Preview
          </Button>
          <Button
            onClick={handlePasteAdd}
            disabled={loading || !pasteText.trim()}
          >
            {loading ? <Spinner /> : "Add from paste"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Excel / CSV</label>
        <p className="text-xs text-muted">
          Header row with columns: name, quantity (optional), category (optional).
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
        />
      </div>

      {preview && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium">{preview.count} item{preview.count === 1 ? "" : "s"} ready</p>
          {preview.sample.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-muted">
              {preview.sample.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {preview.count > preview.sample.length && (
                <li>…and {preview.count - preview.sample.length} more</li>
              )}
            </ul>
          )}
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.includes("Failed") || message.includes("No valid") ? "text-red-600" : "text-success"}`}>
          {message}
        </p>
      )}
    </Card>
  );
}
