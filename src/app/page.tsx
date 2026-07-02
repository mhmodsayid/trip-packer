"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { JoinLockoutNotice, useJoinLockout } from "@/components/JoinLockoutNotice";
import { RecentTrips } from "@/components/RecentTrips";
import { ShareLink } from "@/components/ShareLink";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { recordFailure } from "@/lib/attempts";
import { buildJoinUrl } from "@/lib/storage";
import { formatError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase";
import { extractTripIdFromJoinInput, isValidUuid } from "@/lib/uuid";
import { createTrip } from "@/lib/trips";
import type { Trip } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { t, te } = useTranslation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [joinTripId, setJoinTripId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const { locked: joinLocked, message: joinLockMessage } = useJoinLockout();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setCreateError(null);

    try {
      const trip = await createTrip(trimmed);
      setCreatedTrip(trip);
    } catch (err) {
      setCreateError(formatError(err, te, "failedCreateTrip"));
    } finally {
      setLoading(false);
    }
  }

  function handleJoinByTripId(e: FormEvent) {
    e.preventDefault();
    if (joinLocked) return;

    const tripId = extractTripIdFromJoinInput(joinTripId);
    if (!tripId || !isValidUuid(tripId)) {
      recordFailure();
      setJoinError(te("invalidTripId"));
      return;
    }
    setJoinError(null);
    router.push(`/t/${tripId}/join`);
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("appTitle")}</h1>
          <p className="mt-2 text-muted">{t("appTaglineShort")}</p>
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
          <h1 className="text-2xl font-bold">{t("tripCreated")}</h1>
          <p className="mt-2 text-muted">
            {t("tripCreatedHint")}{" "}
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
            {t("continueToList")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12 animate-section-in">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-white shadow-md">
          🎒
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t("appTitle")}</h1>
        <p className="mt-2 text-muted">{t("appTagline")}</p>
      </div>

      <RecentTrips />

      <Card className="mb-6">
        <h2 className="font-semibold">{t("createTrip")}</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <Input
            placeholder={t("tripNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? <Spinner label={t("loading")} /> : t("createTripButton")}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">{t("joinExisting")}</h2>
        <p className="mt-1 text-sm text-muted">{t("joinExistingHint")}</p>
        <form onSubmit={handleJoinByTripId} className="mt-4 space-y-3">
          <JoinLockoutNotice message={joinLockMessage} />
          <div>
            <label htmlFor="join-trip-id" className="text-sm font-medium">
              {t("tripIdLabel")}
            </label>
            <Input
              id="join-trip-id"
              placeholder={t("tripIdPlaceholder")}
              value={joinTripId}
              onChange={(e) => setJoinTripId(e.target.value)}
              disabled={joinLocked}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={joinLocked || !joinTripId.trim()}
          >
            {t("continueToJoin")}
          </Button>
        </form>
        {joinError && (
          <p className="mt-3 animate-toast-in text-sm text-red-600" role="alert">
            {joinError}
          </p>
        )}
      </Card>

      {createError && (
        <p className="mt-4 animate-toast-in text-center text-sm text-red-600" role="alert">
          {createError}
        </p>
      )}
    </main>
  );
}
