"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddItemsPanel } from "@/components/AddItemsPanel";
import { Modal } from "@/components/Modal";
import { ConfigWarning } from "@/components/ConfigWarning";
import { ItemList } from "@/components/ItemList";
import { ShareLink } from "@/components/ShareLink";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Spinner } from "@/components/ui";
import { formatError } from "@/lib/errors";
import { buildJoinUrl, getStoredPerson } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  claimItem,
  deleteItem,
  getItems,
  getPeople,
  getTrip,
  insertItems,
  subscribeToItems,
  subscribeToPeople,
  unclaimItem,
} from "@/lib/trips";
import type { Item, Person, Trip } from "@/types";

interface TripPageClientProps {
  tripId: string;
}

export function TripPageClient({ tripId }: TripPageClientProps) {
  const router = useRouter();
  const { t, te } = useTranslation();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [person, setPerson] = useState<{ id: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [tripData, itemsData, peopleData] = await Promise.all([
        getTrip(tripId),
        getItems(tripId),
        getPeople(tripId),
      ]);

      if (!tripData) {
        setError(te("tripNotFound"));
        return;
      }

      setTrip(tripData);
      setItems(itemsData);
      setPeople(peopleData);
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

    return () => {
      unsubItems();
      unsubPeople();
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{trip.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {t("signedInAs")}{" "}
              <span className="font-medium text-foreground">{person.name}</span>
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowShare((s) => !s)}
            className="shrink-0"
          >
            {showShare ? t("hideShareLink") : t("shareJoinLink")}
          </Button>
        </div>
      </header>

      {showShare && (
        <div className="mb-6">
          <ShareLink url={joinUrl} pin={trip.pin} />
        </div>
      )}

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
          onClaim={(id) => claimItem(id, person.id)}
          onUnclaim={(id) => unclaimItem(id, person.id)}
          onDelete={(id) => deleteItem(id, person.id)}
          loading={loading}
        />
      </section>

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
    </main>
  );
}
