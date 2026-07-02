"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { JoinLockoutNotice, useJoinLockout } from "@/components/JoinLockoutNotice";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { recordFailure, resetAttempts } from "@/lib/attempts";
import { formatError } from "@/lib/errors";
import { pinsMatch } from "@/lib/pin";
import { setStoredPerson } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { joinTrip, getTrip } from "@/lib/trips";
import type { Trip } from "@/types";

interface JoinFormProps {
  params: Promise<{ tripId: string }>;
}

type JoinStage = "loading" | "pin" | "name";

export function JoinForm({ params }: JoinFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, te } = useTranslation();
  const { locked: joinLocked, message: joinLockMessage } = useJoinLockout();
  const [tripId, setTripId] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stage, setStage] = useState<JoinStage>("loading");
  const [name, setName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const urlPin = searchParams.get("pin") ?? "";

  useEffect(() => {
    params.then((p) => setTripId(p.tripId));
  }, [params]);

  useEffect(() => {
    if (!tripId || !isSupabaseConfigured()) {
      if (tripId) setStage("pin");
      return;
    }

    setStage("loading");
    setFatalError(null);
    setStepError(null);

    getTrip(tripId)
      .then((loaded) => {
        if (!loaded) {
          recordFailure();
          setFatalError(te("tripNotFound"));
          return;
        }

        setTrip(loaded);

        if (urlPin) {
          if (!pinsMatch(loaded.pin, urlPin)) {
            recordFailure();
            setFatalError(te("invalidPin"));
            return;
          }
          resetAttempts();
          setStage("name");
          return;
        }

        setStage("pin");
      })
      .catch((err) => {
        setFatalError(formatError(err, te, "failedValidateTrip"));
      });
  }, [tripId, urlPin, te]);

  async function handlePinSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trip || joinLocked) return;

    const entered = pinInput.trim();
    if (!entered) return;

    setPinSubmitting(true);
    setStepError(null);

    if (!pinsMatch(trip.pin, entered)) {
      recordFailure();
      setStepError(te("invalidPin"));
      setPinSubmitting(false);
      return;
    }

    resetAttempts();
    setStage("name");
    setPinSubmitting(false);
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!tripId || stage !== "name") return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setStepError(null);

    try {
      const { person, sessionId } = await joinTrip(tripId, trimmed);
      setStoredPerson(tripId, { id: person.id, name: person.name, sessionId });
      router.replace(`/t/${tripId}`);
    } catch (err) {
      setStepError(formatError(err, te, "failedJoinTrip"));
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

  if (stage === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner label={t("loading")} className="h-8 w-8 text-primary" />
      </main>
    );
  }

  if (fatalError) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 animate-section-in">
        <Card className="space-y-3">
          <h1 className="text-xl font-bold">{t("cantJoin")}</h1>
          <JoinLockoutNotice message={joinLockMessage} />
          <p className="text-red-600">{fatalError}</p>
          <Button className="mt-1" variant="secondary" onClick={() => router.push("/")}>
            {t("goHome")}
          </Button>
        </Card>
      </main>
    );
  }

  if (stage === "pin") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12 animate-section-in">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{t("joinTrip")}</h1>
          {trip?.name && (
            <p className="mt-2 text-muted">
              {t("joiningTrip")}{" "}
              <span className="font-medium text-foreground">{trip.name}</span>
            </p>
          )}
        </div>

        <Card>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <JoinLockoutNotice message={joinLockMessage} />
            <div>
              <label htmlFor="pin" className="text-sm font-medium">
                {t("enterPin")}
              </label>
              <Input
                id="pin"
                placeholder={t("pinPlaceholder")}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                disabled={pinSubmitting || joinLocked}
                autoFocus={!joinLocked}
                autoComplete="off"
                className="mt-1 font-mono uppercase tracking-wider"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={joinLocked || pinSubmitting || !pinInput.trim()}
            >
              {pinSubmitting ? <Spinner label={t("loading")} /> : t("continueToJoin")}
            </Button>
          </form>
          {stepError && !joinLocked && (
            <p className="mt-3 animate-toast-in text-sm text-red-600" role="alert">
              {stepError}
            </p>
          )}
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12 animate-section-in">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{t("joinTrip")}</h1>
        {trip?.name && (
          <p className="mt-2 text-muted">
            {t("joiningTrip")}{" "}
            <span className="font-medium text-foreground">{trip.name}</span>
          </p>
        )}
      </div>

      <Card>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              {t("yourName")}
            </label>
            <Input
              id="name"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
            {submitting ? <Spinner label={t("loading")} /> : t("joinTripButton")}
          </Button>
        </form>
        {stepError && (
          <p className="mt-3 animate-toast-in text-sm text-red-600" role="alert">
            {stepError}
          </p>
        )}
      </Card>
    </main>
  );
}
