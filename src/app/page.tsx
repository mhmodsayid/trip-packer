"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { ShareLink } from "@/components/ShareLink";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { buildJoinUrl } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createTrip } from "@/lib/trips";
import type { Trip } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [joinLink, setJoinLink] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const trip = await createTrip(trimmed);
      setCreatedTrip(trip);
      setJoinLink(buildJoinUrl(trip.id, trip.pin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip.");
    } finally {
      setLoading(false);
    }
  }

  function handleJoinExisting(e: FormEvent) {
    e.preventDefault();
    try {
      const url = new URL(joinLink.trim());
      router.push(url.pathname + url.search);
    } catch {
      if (joinLink.trim().startsWith("/")) {
        router.push(joinLink.trim());
      } else {
        setError("Enter a valid join link URL.");
      }
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Trip Packer
          </h1>
          <p className="mt-2 text-muted">
            Coordinate what everyone brings on your next adventure.
          </p>
        </div>
        <ConfigWarning />
      </main>
    );
  }

  if (createdTrip) {
    const url = buildJoinUrl(createdTrip.id, createdTrip.pin);
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Trip created!</h1>
          <p className="mt-2 text-muted">
            Share the link below so others can join{" "}
            <span className="font-medium text-foreground">{createdTrip.name}</span>.
          </p>
        </div>

        <ShareLink url={url} pin={createdTrip.pin} />

        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() =>
              router.push(`/t/${createdTrip.id}/join?pin=${encodeURIComponent(createdTrip.pin)}`)
            }
          >
            Continue to packing list
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-white shadow-md">
          🎒
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Trip Packer</h1>
        <p className="mt-2 text-muted">
          Create a shared packing list. Everyone claims what they&apos;ll bring.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold">Create a new trip</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <Input
            placeholder="Trip name (e.g. Yosemite Camping)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? <Spinner /> : "Create trip"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">Join an existing trip</h2>
        <form onSubmit={handleJoinExisting} className="mt-4 space-y-3">
          <Input
            placeholder="Paste join link..."
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="w-full" disabled={!joinLink.trim()}>
            Open link
          </Button>
        </form>
      </Card>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </main>
  );
}
