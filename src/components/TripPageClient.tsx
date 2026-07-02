"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChangeNameForm } from "@/components/ChangeNameForm";
import { AddItemsPanel } from "@/components/AddItemsPanel";
import { MembersOverview } from "@/components/MembersOverview";
import { Modal } from "@/components/Modal";
import { ConfigWarning } from "@/components/ConfigWarning";
import { ItemList } from "@/components/ItemList";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { SettlementSummary } from "@/components/SettlementSummary";
import { ShareLink } from "@/components/ShareLink";
import { TripPrintView } from "@/components/TripPrintView";
import { TripSettingsPanel } from "@/components/TripSettingsPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import { formatError, errorCode } from "@/lib/errors";
import { formatDate } from "@/lib/format-date";
import { isAdminPersonId } from "@/lib/people";
import { buildJoinUrl, clearStoredPerson, getStoredPerson, setStoredPerson } from "@/lib/storage";
import { recordTripVisit } from "@/lib/trip-history";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  addPayment,
  claimItem,
  claimItems,
  deleteItem,
  deletePayment,
  getItems,
  getPayments,
  getPeople,
  getTrip,
  insertItems,
  logout,
  ownerDeleteItem,
  ownerRemoveMember,
  ownerUpdateItemName,
  ownerUpdateItemPrice,
  renamePerson,
  subscribeToItems,
  subscribeToPayments,
  subscribeToPeople,
  touchPresence,
  unclaimItem,
  updateItemName,
  updateItemPrice,
  updatePayment,
} from "@/lib/trips";
import type { Item, Payment, Person, StoredPerson, Trip } from "@/types";

const PRESENCE_HEARTBEAT_MS = 45_000;

interface TripPageClientProps {
  tripId: string;
}

export function TripPageClient({ tripId }: TripPageClientProps) {
  const router = useRouter();
  const { t, te, locale } = useTranslation();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [changeNameOpen, setChangeNameOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const changeNameRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const summaryButtonRef = useRef<HTMLButtonElement>(null);
  const [person, setPerson] = useState<StoredPerson | null>(null);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [tripData, itemsData, peopleData, paymentsData] = await Promise.all([
        getTrip(tripId),
        getItems(tripId),
        getPeople(tripId),
        getPayments(tripId),
      ]);

      if (!tripData) {
        setError(te("tripNotFound"));
        return;
      }

      setTrip(tripData);
      setItems(itemsData);
      setPeople(peopleData);
      setPayments(paymentsData);
      setError(null);
    } catch (err) {
      setError(formatError(err, te, "failedLoadTrip"));
    }
  }, [tripId, te]);

  useEffect(() => {
    const stored = getStoredPerson(tripId);
    if (!stored) {
      router.replace(`/t/${tripId}/join`);
      return;
    }
    setPerson(stored);
  }, [tripId, router]);

  const loadedTripName = trip?.name;
  const loadedTripPin = trip?.pin;
  const personName = person?.name;
  useEffect(() => {
    if (!loadedTripName || !loadedTripPin || !personName) return;
    recordTripVisit({
      id: tripId,
      name: loadedTripName,
      pin: loadedTripPin,
      personName,
    });
  }, [tripId, loadedTripName, loadedTripPin, personName]);

  useEffect(() => {
    if (!person?.sessionId) return;

    const runHeartbeat = () => {
      touchPresence(person.id, person.sessionId).catch((err) => {
        if (errorCode(err) === "sessionExpired") {
          clearStoredPerson(tripId);
          router.replace(`/t/${tripId}/join`);
        }
      });
    };

    runHeartbeat();
    const intervalId = window.setInterval(runHeartbeat, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(intervalId);
  }, [person?.id, person?.sessionId, tripId, router]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadData().finally(() => setLoading(false));

    const unsubItems = subscribeToItems(tripId, () => {
      getItems(tripId).then(setItems).catch(console.error);
    });
    const unsubPeople = subscribeToPeople(tripId, () => {
      getPeople(tripId).then(setPeople).catch(console.error);
    });
    const unsubPayments = subscribeToPayments(tripId, () => {
      getPayments(tripId).then(setPayments).catch(console.error);
    });

    return () => {
      unsubItems();
      unsubPeople();
      unsubPayments();
    };
  }, [tripId, loadData]);

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ConfigWarning />
      </main>
    );
  }

  if (!person) {
    return (
      <main className="flex min-h-[50dvh] items-center justify-center">
        <Spinner label={t("loading")} className="h-8 w-8 text-primary" />
      </main>
    );
  }

  if (loading && !trip) {
    return (
      <main className="flex min-h-[50dvh] items-center justify-center">
        <Spinner label={t("loading")} className="h-8 w-8 text-primary" />
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <p className="text-red-600">{error ?? te("tripNotFound")}</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/")}>
            {t("goHome")}
          </Button>
        </Card>
      </main>
    );
  }

  const joinUrl = buildJoinUrl(trip.id, trip.pin);
  const isAdminSession = isAdminPersonId(people, person.id);
  const isOwner =
    !!person &&
    !!trip.owner_person_id &&
    person.id === trip.owner_person_id;

  async function handleItemDelete(itemId: string) {
    if (!person) return;
    if (isOwner) {
      await ownerDeleteItem(itemId, tripId, person.id, person.sessionId);
    } else {
      await deleteItem(itemId, person.id);
    }
  }

  async function handleItemUpdateName(itemId: string, name: string) {
    if (!person) return;
    if (isOwner) {
      await ownerUpdateItemName(itemId, name, tripId, person.id, person.sessionId);
    } else {
      await updateItemName(itemId, name, person.id);
    }
  }

  async function handleItemUpdatePrice(itemId: string, price: number | null) {
    if (!person) return;
    if (isOwner) {
      await ownerUpdateItemPrice(itemId, price, tripId, person.id, person.sessionId);
    } else {
      await updateItemPrice(itemId, price, person.id);
    }
  }

  async function handleRemoveMember(targetPersonId: string) {
    if (!person) return;
    await ownerRemoveMember(tripId, person.id, person.sessionId, targetPersonId);
    const peopleData = await getPeople(tripId);
    setPeople(peopleData);
  }

  async function handleRename(newName: string) {
    if (!person) return;
    const updated = await renamePerson(person.id, newName);
    const stored: StoredPerson = {
      id: person.id,
      name: updated.name,
      sessionId: person.sessionId,
    };
    setStoredPerson(tripId, stored);
    setPerson(stored);
    setPeople((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, name: updated.name } : p))
    );
    setChangeNameOpen(false);
  }

  async function handleLogout() {
    if (!person) return;
    if (!window.confirm(t("logoutConfirm"))) return;

    try {
      await logout(person.id, person.sessionId);
    } catch (err) {
      console.error(err);
    }
    clearStoredPerson(tripId);
    router.replace(`/t/${tripId}/join`);
  }

  return (
    <>
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8 animate-section-in print:hidden">
      <header className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{trip.name}</h1>
            {trip.trip_date && (
              <p className="mt-1 text-sm text-muted">
                {t("tripDate")}:{" "}
                <time dateTime={trip.trip_date} className="font-medium text-foreground">
                  {formatDate(trip.trip_date, locale)}
                </time>
              </p>
            )}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span>
                {t("signedInAs")}{" "}
                <span className="font-medium text-foreground">{person.name}</span>
              </span>
              {isOwner && <Badge variant="default">{t("ownerBadge")}</Badge>}
              {!isAdminSession && (
                <>
                  <button
                    ref={changeNameRef}
                    type="button"
                    onClick={() => setChangeNameOpen(true)}
                    className="inline-flex min-h-8 items-center gap-1 rounded-md text-xs font-medium text-primary motion-safe:transition-colors motion-safe:duration-200 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path d="m2.695 14.762-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
                    </svg>
                    {t("changeName")}
                  </button>
                  <span className="text-muted" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-8 items-center gap-1 rounded-md text-xs font-medium text-muted motion-safe:transition-colors motion-safe:duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Zm6.47 4.97a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 1 0 1.06-1.06L8.56 12.5H16.5a.75.75 0 0 0 0-1.5H8.56l1.97-1.97a.75.75 0 0 0 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("logoutDevice")}
              </button>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isOwner && (
              <Button
                ref={settingsButtonRef}
                variant="secondary"
                onClick={() => setSettingsOpen(true)}
              >
                {t("tripSettings")}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => router.push("/")}
              className="gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-3v-4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v4H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" />
              </svg>
              {t("switchTrip")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowShare((s) => !s)}
            >
              {showShare ? t("hideShareLink") : t("shareJoinLink")}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              {t("exportPdf")}
            </Button>
          </div>
        </div>
      </header>

      {showShare && (
        <div className="mb-6 animate-toast-in">
          <ShareLink url={joinUrl} pin={trip.pin} />
        </div>
      )}

      <MembersOverview
        people={people}
        items={items}
        payments={payments}
        currentPersonId={person.id}
        ownerPersonId={trip.owner_person_id}
        isOwner={isOwner}
        onRemoveMember={isOwner ? handleRemoveMember : undefined}
      />

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("packingList")}</h2>
          <Button
            ref={addButtonRef}
            onClick={() => setAddModalOpen(true)}
            className="gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            {t("addItems")}
          </Button>
        </div>
        <ItemList
          items={items}
          people={people}
          currentPersonId={person.id}
          isOwner={isOwner}
          onClaim={(id) => claimItem(id, person.id)}
          onUnclaim={(id) => unclaimItem(id, person.id)}
          onDelete={handleItemDelete}
          onUpdatePrice={handleItemUpdatePrice}
          onUpdateName={handleItemUpdateName}
          onClaimMany={(ids) => claimItems(ids, person.id)}
          loading={loading}
        />
      </section>

      <section className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("moneyTitle")}</h2>
          <Button
            ref={summaryButtonRef}
            variant="secondary"
            onClick={() => setSummaryOpen(true)}
          >
            {t("viewSummary")}
          </Button>
        </div>
        <PaymentsPanel
          payments={payments}
          people={people}
          currentPersonId={person.id}
          onAdd={async (amount, note) => {
            await addPayment(tripId, person.id, amount, note);
          }}
          onUpdate={(id, amount, note) => updatePayment(id, person.id, { amount, note })}
          onDelete={(id) => deletePayment(id, person.id)}
        />
      </section>

      <Modal
        open={changeNameOpen}
        onClose={() => setChangeNameOpen(false)}
        title={t("changeNameTitle")}
        returnFocusRef={changeNameRef}
      >
        <ChangeNameForm
          currentName={person.name}
          onSave={handleRename}
          onCancel={() => setChangeNameOpen(false)}
        />
      </Modal>

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t("addItems")}
        returnFocusRef={addButtonRef}
      >
        <AddItemsPanel
          inModal
          onAddItems={(newItems) => insertItems(tripId, person.id, newItems)}
          onSuccess={() => setAddModalOpen(false)}
        />
      </Modal>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t("tripSettings")}
        returnFocusRef={settingsButtonRef}
      >
        <TripSettingsPanel
          trip={trip}
          person={person}
          onTripUpdated={(updated) => setTrip(updated)}
        />
      </Modal>

      <Modal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title={t("summaryTitle")}
        returnFocusRef={summaryButtonRef}
      >
        <SettlementSummary people={people} items={items} payments={payments} />
      </Modal>
    </main>

    <TripPrintView trip={trip} items={items} people={people} payments={payments} />
    </>
  );
}
