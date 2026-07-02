"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Payment, Person } from "@/types";
import { useTranslation } from "@/components/LanguageProvider";
import { formatAmount, parseAmountInput } from "@/lib/format-amount";
import { formatError } from "@/lib/errors";
import { Button, Card, Input, Spinner } from "@/components/ui";

interface PaymentsPanelProps {
  payments: Payment[];
  people: Person[];
  currentPersonId: string;
  onAdd: (amount: number, note: string | null) => Promise<void>;
  onUpdate: (paymentId: string, amount: number, note: string | null) => Promise<void>;
  onDelete: (paymentId: string) => Promise<void>;
}

export function PaymentsPanel({
  payments,
  people,
  currentPersonId,
  onAdd,
  onUpdate,
  onDelete,
}: PaymentsPanelProps) {
  const { t, te, locale } = useTranslation();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) map.set(p.id, p.name);
    return map;
  }, [people]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAmountInput(amount);
    if (parsed == null) return;

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(parsed, note.trim() || null);
      setAmount("");
      setNote("");
    } catch (err) {
      setError(formatError(err, te, "failedAddPayment"));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(payment: Payment) {
    setEditingId(payment.id);
    setEditAmount(String(payment.amount));
    setEditNote(payment.note ?? "");
  }

  async function saveEdit(paymentId: string) {
    const parsed = parseAmountInput(editAmount);
    if (parsed == null) return;

    setActionId(paymentId);
    setError(null);
    try {
      await onUpdate(paymentId, parsed, editNote.trim() || null);
      setEditingId(null);
    } catch (err) {
      setError(formatError(err, te, "failedUpdatePayment"));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(paymentId: string) {
    if (!window.confirm(t("deletePaymentConfirm"))) return;
    setActionId(paymentId);
    setError(null);
    try {
      await onDelete(paymentId);
    } catch (err) {
      setError(formatError(err, te, "failedDeletePayment"));
    } finally {
      setActionId(null);
    }
  }

  return (
    <Card className="space-y-4">
      <h3 className="font-semibold">{t("paymentsTitle")}</h3>
      <p className="text-sm text-muted">{t("paymentsHint")}</p>

      <form onSubmit={handleAdd} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="payment-amount" className="text-sm font-medium">
              {t("amountLabel")}
            </label>
            <Input
              id="payment-amount"
              type="text"
              inputMode="decimal"
              placeholder={t("amountPlaceholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="payment-note" className="text-sm font-medium">
              {t("paymentNote")}
            </label>
            <Input
              id="payment-note"
              placeholder={t("paymentNotePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              className="mt-1"
            />
          </div>
        </div>
        <Button type="submit" disabled={submitting || parseAmountInput(amount) == null}>
          {submitting ? <Spinner label={t("loading")} /> : t("addPayment")}
        </Button>
      </form>

      {error && (
        <p className="animate-toast-in text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {payments.length === 0 ? (
        <p className="text-sm text-muted">{t("noPaymentsYet")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {payments.map((payment) => {
            const isMine = payment.person_id === currentPersonId;
            const busy = actionId === payment.id;
            const name =
              payment.person_id === currentPersonId
                ? t("you")
                : peopleMap.get(payment.person_id) ?? t("unknown");

            if (editingId === payment.id) {
              return (
                <li key={payment.id} className="space-y-2 px-4 py-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      disabled={busy}
                      inputMode="decimal"
                    />
                    <Input
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      disabled={busy}
                      placeholder={t("paymentNotePlaceholder")}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(payment.id)}
                      disabled={busy || parseAmountInput(editAmount) == null}
                    >
                      {busy ? <Spinner label={t("loading")} /> : t("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                      disabled={busy}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={payment.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {name} · {formatAmount(payment.amount, locale)}
                  </p>
                  {payment.note && (
                    <p className="text-sm text-muted">{payment.note}</p>
                  )}
                </div>
                {isMine && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(payment)}
                      disabled={busy}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(payment.id)}
                      disabled={busy}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
