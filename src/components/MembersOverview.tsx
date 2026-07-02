"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Item, Payment, Person } from "@/types";
import { Modal } from "@/components/Modal";
import { useTranslation } from "@/components/LanguageProvider";
import { formatAmount } from "@/lib/format-amount";
import { formatError } from "@/lib/errors";
import { computeMemberOverview } from "@/lib/settlement";
import { Badge, Button, Spinner } from "@/components/ui";

interface MembersOverviewProps {
  people: Person[];
  items: Item[];
  payments: Payment[];
  currentPersonId: string;
  ownerPersonId?: string | null;
  isOwner?: boolean;
  onRemoveMember?: (personId: string) => Promise<void>;
}

export function MembersOverview({
  people,
  items,
  payments,
  currentPersonId,
  ownerPersonId,
  isOwner = false,
  onRemoveMember,
}: MembersOverviewProps) {
  const { t, te, locale } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<Person | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const removeTriggerRef = useRef<HTMLButtonElement>(null);

  const rows = useMemo(
    () => computeMemberOverview(people, items, payments),
    [people, items, payments]
  );

  function openRemoveMember(person: Person) {
    setRemoveError(null);
    setRemoveTarget(person);
  }

  function closeRemoveMember() {
    if (removing) return;
    setRemoveTarget(null);
    setRemoveError(null);
  }

  async function confirmRemoveMember() {
    if (!removeTarget || removing || !onRemoveMember) return;

    setRemoving(true);
    setRemoveError(null);
    try {
      await onRemoveMember(removeTarget.id);
      setRemoveTarget(null);
    } catch (err) {
      setRemoveError(formatError(err, te, "failedRemovePerson"));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="mb-8 animate-section-in">
      <h2 className="mb-3 text-lg font-semibold">{t("membersTitle")}</h2>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-sm text-muted">
          {t("membersEmpty")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {rows.map((row, index) => {
            const isCurrent = row.personId === currentPersonId;
            const isTripOwner = !!ownerPersonId && row.personId === ownerPersonId;
            const canRemove =
              isOwner &&
              onRemoveMember &&
              row.personId !== currentPersonId;

            return (
              <li
                key={row.personId}
                className={[
                  "border-b border-border/70 px-4 py-3 last:border-b-0",
                  "motion-safe:transition-colors motion-safe:duration-200",
                  isCurrent ? "bg-primary/5" : "hover:bg-slate-50/80",
                ].join(" ")}
                style={
                  index > 0 ? undefined : ({ animationDelay: "40ms" } as CSSProperties)
                }
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{row.personName}</span>
                    {isCurrent && <Badge variant="success">{t("you")}</Badge>}
                    {isTripOwner && <Badge variant="default">{t("ownerBadge")}</Badge>}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted">{t("memberItems")}</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {row.itemCount}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted">{t("memberPaying")}</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {formatAmount(row.itemsTotal, locale)}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted">{t("memberPayments")}</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {formatAmount(row.paymentsTotal, locale)}
                        </dd>
                      </div>
                      <div className="col-span-2 flex items-baseline gap-1.5 sm:col-span-1">
                        <dt className="text-muted">{t("memberCombinedTotal")}</dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {formatAmount(row.combinedTotal, locale)}
                        </dd>
                      </div>
                    </dl>

                    {canRemove && (
                      <Button
                        ref={removeTriggerRef}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 self-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:self-center"
                        onClick={(e) => {
                          removeTriggerRef.current = e.currentTarget;
                          openRemoveMember(
                            people.find((p) => p.id === row.personId)!
                          );
                        }}
                      >
                        {t("removeMember")}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={removeTarget != null}
        onClose={closeRemoveMember}
        title={t("removeMemberTitle")}
        returnFocusRef={removeTriggerRef}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            {removeTarget
              ? t("removeMemberConfirm", { name: removeTarget.name })
              : ""}
          </p>

          {removeError && (
            <p className="animate-toast-in text-sm text-red-600" role="alert">
              {removeError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeRemoveMember}
              disabled={removing}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmRemoveMember}
              disabled={removing}
            >
              {removing ? <Spinner label={t("loading")} /> : t("removeMember")}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
