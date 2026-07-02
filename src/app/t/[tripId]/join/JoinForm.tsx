"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { formatError } from "@/lib/errors";
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
  const { t, te } = useTranslation();
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
      setError(te("missingPin"));
      setLoading(false);
      return;
    }

    setLoading(true);
    getTrip(tripId)
      .then((trip) => {
        if (!trip) {
          setError(te("tripNotFound"));
          return;
        }
        if (!pinsMatch(trip.pin, pin)) {
          setError(te("invalidPin"));
          return;
        }
        setTripName(trip.name);
        setPinValid(true);
      })
      .catch((err) => {
        setError(formatError(err, te, "failedValidateTrip"));
      })
      .finally(() => setLoading(false));
  }, [tripId, pin, te]);

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
      setError(formatError(err, te, "failedJoinTrip"));
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
        <Spinner label={t("loading")} className="h-8 w-8 text-primary" />
      </main>
    );
  }

  if (error && !pinValid) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-xl font-bold">{t("cantJoin")}</h1>
          <p className="mt-2 text-red-600">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push("/")}>
            {t("goHome")}
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
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
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>
    </main>
  );
}
