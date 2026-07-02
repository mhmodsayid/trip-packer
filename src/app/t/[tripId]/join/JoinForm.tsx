"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { JoinLockoutNotice, useJoinLockout } from "@/components/JoinLockoutNotice";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { recordFailure, resetAttempts } from "@/lib/attempts";
import { errorCode, formatError } from "@/lib/errors";
import { pinsMatch } from "@/lib/pin";
import { clearStoredPerson, getStoredPerson, setStoredPerson } from "@/lib/storage";
import { recordTripVisit } from "@/lib/trip-history";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getTrip, joinTrip, resumeTripSession } from "@/lib/trips";

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
  const [tripName, setTripName] = useState<string | null>(null);
  const [tripPin, setTripPin] = useState<string | null>(null);
  const [stage, setStage] = useState<JoinStage>("loading");
  const [name, setName] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [takeOverSubmitting, setTakeOverSubmitting] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showTakeOver, setShowTakeOver] = useState(false);

  const urlPin = searchParams.get("pin") ?? "";

  useEffect(() => {
    params.then((p) => setTripId(p.tripId));
  }, [params]);

  const enterTrip = useCallback(
    (
      id: string,
      personId: string,
      personName: string,
      sessionId: string,
      name: string,
      pin: string
    ) => {
      setStoredPerson(id, { id: personId, name: personName, sessionId });
      recordTripVisit({ id, name, pin, personName });
      router.replace(`/t/${id}`);
    },
    [router]
  );

  const proceedAfterPinSuccess = useCallback(
    async (id: string, name: string, pin: string) => {
      const stored = getStoredPerson(id);
      if (stored) {
        try {
          const { person, sessionId } = await resumeTripSession(
            id,
            stored.id,
            stored.sessionId
          );
          enterTrip(id, person.id, person.name, sessionId, name, pin);
          return;
        } catch (err) {
          if (errorCode(err) === "sessionExpired") {
            clearStoredPerson(id);
            setName(stored.name);
          }
        }
      }
      setStage("name");
    },
    [enterTrip]
  );

  useEffect(() => {
    if (!tripId || !isSupabaseConfigured()) {
      if (tripId) setStage("pin");
      return;
    }

    setStage("loading");
    setFatalError(null);
    setStepError(null);
    setShowTakeOver(false);

    getTrip(tripId)
      .then(async (loaded) => {
        if (!loaded) {
          recordFailure();
          setFatalError(te("tripNotFound"));
          return;
        }

        setTripName(loaded.name);
        setTripPin(loaded.pin);

        if (urlPin) {
          if (!pinsMatch(loaded.pin, urlPin)) {
            recordFailure();
            setFatalError(te("invalidPin"));
            return;
          }
          resetAttempts();
          await proceedAfterPinSuccess(tripId, loaded.name, loaded.pin);
          return;
        }

        setStage("pin");
      })
      .catch((err) => {
        setFatalError(formatError(err, te, "failedValidateTrip"));
      });
  }, [tripId, urlPin, te, proceedAfterPinSuccess]);

  async function handlePinSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tripId || joinLocked) return;

    const entered = pinInput.trim();
    if (!entered) return;

    setPinSubmitting(true);
    setStepError(null);

    const loaded = await getTrip(tripId);
    if (!loaded) {
      recordFailure();
      setStepError(te("tripNotFound"));
      setPinSubmitting(false);
      return;
    }

    if (!pinsMatch(loaded.pin, entered)) {
      recordFailure();
      setStepError(te("invalidPin"));
      setPinSubmitting(false);
      return;
    }

    setTripName(loaded.name);
    setTripPin(loaded.pin);
    resetAttempts();
    setPinSubmitting(false);
    setStage("loading");
    await proceedAfterPinSuccess(tripId, loaded.name, loaded.pin);
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!tripId || stage !== "name") return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setStepError(null);
    setShowTakeOver(false);

    try {
      const { person, sessionId } = await joinTrip(tripId, trimmed);
      enterTrip(tripId, person.id, person.name, sessionId, tripName ?? "", tripPin ?? "");
    } catch (err) {
      if (errorCode(err) === "nameInUse") {
        setShowTakeOver(true);
      }
      setStepError(formatError(err, te, "failedJoinTrip"));
      setSubmitting(false);
    }
  }

  async function handleTakeOver() {
    if (!tripId) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setTakeOverSubmitting(true);
    setStepError(null);

    try {
      const { person, sessionId } = await joinTrip(tripId, trimmed, { takeOver: true });
      enterTrip(tripId, person.id, person.name, sessionId, tripName ?? "", tripPin ?? "");
    } catch (err) {
      setStepError(formatError(err, te, "failedJoinTrip"));
      setTakeOverSubmitting(false);
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
          {tripName && (
            <p className="mt-2 text-muted">
              {t("joiningTrip")}{" "}
              <span className="font-medium text-foreground">{tripName}</span>
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
        {tripName && (
          <p className="mt-2 text-muted">
            {t("joiningTrip")}{" "}
            <span className="font-medium text-foreground">{tripName}</span>
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
              onChange={(e) => {
                setName(e.target.value);
                setShowTakeOver(false);
                setStepError(null);
              }}
              disabled={submitting || takeOverSubmitting}
              autoFocus
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || takeOverSubmitting || !name.trim()}
          >
            {submitting ? <Spinner label={t("loading")} /> : t("joinTripButton")}
          </Button>
        </form>

        {showTakeOver && name.trim() && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-sm text-muted">{t("takeOverNameHint")}</p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={takeOverSubmitting || submitting}
              onClick={handleTakeOver}
            >
              {takeOverSubmitting ? (
                <Spinner label={t("loading")} />
              ) : (
                t("takeOverName", { name: name.trim() })
              )}
            </Button>
          </div>
        )}

        {stepError && (
          <p className="mt-3 animate-toast-in text-sm text-red-600" role="alert">
            {stepError}
          </p>
        )}
      </Card>
    </main>
  );
}
