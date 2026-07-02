"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Input, Spinner } from "@/components/ui";
import { formatError } from "@/lib/errors";
import { clearStoredPerson } from "@/lib/storage";
import {
  ownerDeleteTrip,
  ownerRegenerateTripPin,
  ownerUpdateTrip,
} from "@/lib/trips";
import type { StoredPerson, Trip } from "@/types";

interface TripSettingsPanelProps {
  trip: Trip;
  person: StoredPerson;
  onTripUpdated: (trip: Trip) => void;
}

export function TripSettingsPanel({ trip, person, onTripUpdated }: TripSettingsPanelProps) {
  const { t, te } = useTranslation();
  const router = useRouter();
  const [renameBusy, setRenameBusy] = useState(false);
  const [dateBusy, setDateBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripName, setTripName] = useState(trip.name);
  const [tripDate, setTripDate] = useState(trip.trip_date ?? "");
  const [pin, setPin] = useState(trip.pin);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    const name = tripName.trim();
    if (!name || name === trip.name) return;

    setRenameBusy(true);
    setError(null);
    try {
      await ownerUpdateTrip(trip.id, person.id, person.sessionId, { name });
      onTripUpdated({ ...trip, name });
    } catch (err) {
      setError(formatError(err, te, "actionFailed"));
    } finally {
      setRenameBusy(false);
    }
  }

  async function handleSetDate(e: FormEvent) {
    e.preventDefault();
    const value = tripDate.trim() || null;
    if (value === trip.trip_date) return;

    setDateBusy(true);
    setError(null);
    try {
      await ownerUpdateTrip(trip.id, person.id, person.sessionId, { trip_date: value });
      onTripUpdated({ ...trip, trip_date: value });
    } catch (err) {
      setError(formatError(err, te, "actionFailed"));
    } finally {
      setDateBusy(false);
    }
  }

  async function handleSetPin(e: FormEvent) {
    e.preventDefault();
    const nextPin = pin.trim().toUpperCase();
    if (!nextPin || nextPin === trip.pin) return;

    setPinBusy(true);
    setError(null);
    try {
      await ownerUpdateTrip(trip.id, person.id, person.sessionId, { pin: nextPin });
      onTripUpdated({ ...trip, pin: nextPin });
    } catch (err) {
      setError(formatError(err, te, "actionFailed"));
    } finally {
      setPinBusy(false);
    }
  }

  async function handleRegeneratePin() {
    setRegenBusy(true);
    setError(null);
    try {
      const nextPin = await ownerRegenerateTripPin(trip.id, person.id, person.sessionId);
      setPin(nextPin);
      onTripUpdated({ ...trip, pin: nextPin });
    } catch (err) {
      setError(formatError(err, te, "actionFailed"));
    } finally {
      setRegenBusy(false);
    }
  }

  async function handleDeleteTrip() {
    if (!window.confirm(t("deleteTripConfirm", { name: trip.name }))) return;

    setDeleteBusy(true);
    setError(null);
    try {
      await ownerDeleteTrip(trip.id, person.id, person.sessionId);
      clearStoredPerson(trip.id);
      router.push("/");
    } catch (err) {
      setError(formatError(err, te, "actionFailed"));
      setDeleteBusy(false);
    }
  }

  const anyBusy = renameBusy || dateBusy || pinBusy || regenBusy || deleteBusy;

  return (
    <div className="space-y-4">
      <form onSubmit={handleRename} className="flex flex-wrap gap-2">
        <Input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          className="min-w-[200px] flex-1"
          disabled={anyBusy}
          aria-label={t("adminTripName")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={anyBusy || !tripName.trim()}>
          {renameBusy ? <Spinner label={t("loading")} /> : t("adminRenameTrip")}
        </Button>
      </form>

      <form onSubmit={handleSetDate} className="flex flex-wrap gap-2">
        <Input
          type="date"
          value={tripDate}
          onChange={(e) => setTripDate(e.target.value)}
          className="min-w-[160px] max-w-[200px]"
          disabled={anyBusy}
          aria-label={t("tripDate")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={anyBusy}>
          {dateBusy ? <Spinner label={t("loading")} /> : t("adminSetTripDate")}
        </Button>
      </form>

      <form onSubmit={handleSetPin} className="flex flex-wrap gap-2">
        <Input
          value={pin}
          onChange={(e) => setPin(e.target.value.toUpperCase())}
          className="min-w-[120px] max-w-[160px] font-mono tracking-widest"
          disabled={anyBusy}
          aria-label={t("adminPin")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={anyBusy || !pin.trim()}>
          {pinBusy ? <Spinner label={t("loading")} /> : t("adminSetPin")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleRegeneratePin}
          disabled={anyBusy}
        >
          {regenBusy ? <Spinner label={t("loading")} /> : t("adminRegeneratePin")}
        </Button>
        <Button
          ref={deleteButtonRef}
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={handleDeleteTrip}
          disabled={anyBusy}
        >
          {deleteBusy ? <Spinner label={t("loading")} /> : t("adminDeleteTrip")}
        </Button>
      </div>

      {error && (
        <p className="animate-toast-in text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
