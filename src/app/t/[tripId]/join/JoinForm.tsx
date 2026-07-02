"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { pinsMatch } from "@/lib/pin";
import { setStoredPerson } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { findOrCreatePerson, getTrip } from "@/lib/trips";

interface JoinFormProps {
  params: Promise<{ tripId: string }>;
}

export function JoinForm({ params }: JoinFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinValid, setPinValid] = useState(false);

  const pin = searchParams.get("pin") ?? "";

  useEffect(() => {
    params.then((p) => setTripId(p.tripId));
  }, [params]);

  useEffect(() => {
    if (!tripId || !isSupabaseConfigured()) {
      if (tripId) setLoading(false);
      return;
    }

    if (!pin) {
      setError("Missing PIN in the link. Ask the trip organizer for the full join link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    getTrip(tripId)
      .then((trip) => {
        if (!trip) {
          setError("Trip not found.");
          return;
        }
        if (!pinsMatch(trip.pin, pin)) {
          setError("Invalid PIN. Check the link and try again.");
          return;
        }
        setTripName(trip.name);
        setPinValid(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to validate trip.");
      })
      .finally(() => setLoading(false));
  }, [tripId, pin]);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!tripId || !pinValid) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const person = await findOrCreatePerson(tripId, trimmed);
      setStoredPerson(tripId, { id: person.id, name: person.name });
      router.replace(`/t/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join trip.");
      setSubmitting(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <ConfigWarning />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </main>
    );
  }

  if (error && !pinValid) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-xl font-bold">Can&apos;t join trip</h1>
          <p className="mt-2 text-red-600">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/")}>
            Go home
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Join trip</h1>
        {tripName && (
          <p className="mt-2 text-muted">
            You&apos;re joining <span className="font-medium text-foreground">{tripName}</span>
          </p>
        )}
      </div>

      <Card>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Your name
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
            {submitting ? <Spinner /> : "Join trip"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>
    </main>
  );
}
