"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigWarning } from "@/components/ConfigWarning";
import { ShareLink } from "@/components/ShareLink";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { formatError } from "@/lib/errors";
import { buildJoinUrl } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createTrip } from "@/lib/trips";
import type { Trip } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { t, te } = useTranslation();
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
      setError(formatError(err, te, "failedCreateTrip"));
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
        setError(te("invalidJoinLink"));
      }
    }
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
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-white shadow-md">
          🎒
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t("appTitle")}</h1>
        <p className="mt-2 text-muted">{t("appTagline")}</p>
      </div>

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
        <form onSubmit={handleJoinExisting} className="mt-4 space-y-3">
          <Input
            placeholder={t("joinLinkPlaceholder")}
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="w-full" disabled={!joinLink.trim()}>
            {t("openLink")}
          </Button>
        </form>
      </Card>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </main>
  );
}
