"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminDeleteItemAction,
  adminDeleteTripAction,
  adminRegeneratePinAction,
  adminRenameTripAction,
  adminSetPinAction,
  adminUpdateItemAction,
} from "@/app/admin/actions";
import { AdminEnterTripButton } from "@/components/admin/AdminEnterTripButton";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input } from "@/components/ui";
import type { AdminTripDetail } from "@/lib/admin-data";

interface AdminTripDetailViewProps {
  detail: AdminTripDetail;
}

export function AdminTripDetailView({ detail }: AdminTripDetailViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { trip, items, people } = detail;

  async function handleDeleteTrip() {
    if (!window.confirm(t("adminDeleteTripConfirm", { name: trip.name }))) return;
    await adminDeleteTripAction(trip.id);
  }

  async function handleRegeneratePin() {
    await adminRegeneratePinAction(trip.id);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Link href="/admin" className="text-sm text-primary hover:underline">
        {t("adminBackToDashboard")}
      </Link>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-semibold">{t("adminTripSettings")}</h2>
          <AdminEnterTripButton tripId={trip.id} />
        </div>
        <p className="text-sm text-muted">
          {t("adminTripName")}: <span className="font-medium text-foreground">{trip.name}</span>
        </p>

        <form action={adminRenameTripAction.bind(null, trip.id)} className="flex flex-wrap gap-2">
          <Input name="name" defaultValue={trip.name} className="min-w-[200px] flex-1" />
          <Button type="submit" variant="secondary" size="sm">
            {t("adminRenameTrip")}
          </Button>
        </form>

        <form action={adminSetPinAction.bind(null, trip.id)} className="flex flex-wrap gap-2">
          <Input
            name="pin"
            defaultValue={trip.pin}
            className="min-w-[120px] max-w-[160px] font-mono tracking-widest"
          />
          <Button type="submit" variant="secondary" size="sm">
            {t("adminSetPin")}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleRegeneratePin}>
            {t("adminRegeneratePin")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDeleteTrip}
          >
            {t("adminDeleteTrip")}
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("adminPeopleList")}</h2>
        {people.length === 0 ? (
          <p className="text-sm text-muted">{t("adminNoPeople")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {people.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm shadow-sm"
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("adminItemsList")}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">{t("adminNoItems")}</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    <span>
                      {t("adminAssignedTo")}:{" "}
                      <span className="text-foreground">
                        {item.assignee_name ?? t("adminUnassigned")}
                      </span>
                    </span>
                    <span>
                      {t("adminAddedBy")}:{" "}
                      <span className="text-foreground">
                        {item.added_by_name ?? t("unknown")}
                      </span>
                    </span>
                  </div>
                  <form
                    action={adminUpdateItemAction.bind(null, trip.id, item.id)}
                    className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6"
                  >
                    <Input name="name" defaultValue={item.name} placeholder={t("adminItemName")} />
                    <Input
                      name="quantity"
                      type="number"
                      min={1}
                      defaultValue={item.quantity}
                      placeholder={t("adminQuantity")}
                    />
                    <Input
                      name="category"
                      defaultValue={item.category ?? ""}
                      placeholder={t("adminCategory")}
                    />
                    <Input
                      name="price"
                      defaultValue={item.price ?? ""}
                      placeholder={t("priceLabel")}
                      inputMode="decimal"
                    />
                    <select
                      name="assigned_person_id"
                      defaultValue={item.assigned_person_id ?? ""}
                      className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    >
                      <option value="">{t("adminClearAssignment")}</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" size="sm">
                      {t("adminUpdateItem")}
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={async () => {
                      if (!window.confirm(t("adminDeleteItemConfirm", { name: item.name }))) {
                        return;
                      }
                      await adminDeleteItemAction(trip.id, item.id);
                      router.refresh();
                    }}
                  >
                    {t("adminDeleteItem")}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
