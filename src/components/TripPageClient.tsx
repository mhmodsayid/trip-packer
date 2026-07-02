"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddItemsPanel } from "@/components/AddItemsPanel";
import { ConfigWarning } from "@/components/ConfigWarning";
import { ItemList } from "@/components/ItemList";
import { ShareLink } from "@/components/ShareLink";
import { Button, Card, Spinner } from "@/components/ui";
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
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
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
        setError("Trip not found.");
        return;
      }

      setTrip(tripData);
      setItems(itemsData);
      setPeople(peopleData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trip.");
    }
  }, [tripId]);

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
        <Spinner className="text-primary h-8 w-8" />
      </main>
    );
  }

  if (loading && !trip) {
    return (
      <main className="flex min-h-[50dvh] items-center justify-center">
        <Spinner className="text-primary h-8 w-8" />
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <p className="text-red-600">{error ?? "Trip not found."}</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/")}>
            Go home
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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{trip.name}</h1>
            <p className="mt-1 text-sm text-muted">
              Signed in as <span className="font-medium text-foreground">{person.name}</span>
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowShare((s) => !s)}>
            {showShare ? "Hide share link" : "Share join link"}
          </Button>
        </div>
      </header>

      {showShare && (
        <div className="mb-6">
          <ShareLink url={joinUrl} pin={trip.pin} />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Packing list</h2>
        <ItemList
          items={items}
          people={people}
          currentPersonId={person.id}
          onClaim={(id) => claimItem(id, person.id)}
          onUnclaim={(id) => unclaimItem(id, person.id)}
          onDelete={deleteItem}
          loading={loading}
        />
      </section>

      <AddItemsPanel onAddItems={(newItems) => insertItems(tripId, newItems)} />
    </main>
  );
}
