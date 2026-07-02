"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { useTranslation } from "@/components/LanguageProvider";
import { Button, Spinner } from "@/components/ui";
import { formatError } from "@/lib/errors";
import { setStoredPerson } from "@/lib/storage";
import { joinTripAsAdmin } from "@/lib/trips";

interface AdminEnterTripButtonProps {
  tripId: string;
}

export function AdminEnterTripButton({ tripId }: AdminEnterTripButtonProps) {
  const { t, te } = useTranslation();
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeDialog() {
    if (submitting) return;
    setOpen(false);
    setError(null);
  }

  async function handleEnter() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { person, sessionId } = await joinTripAsAdmin(tripId);
      setStoredPerson(tripId, { id: person.id, name: person.name, sessionId });
      router.push(`/t/${tripId}`);
    } catch (err) {
      setError(formatError(err, te, "failedJoinTrip"));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M3.25 4A2.25 2.25 0 0 1 5.5 1.75h9A2.25 2.25 0 0 1 16.75 4v11.5A2.25 2.25 0 0 1 14.5 17.75h-9A2.25 2.25 0 0 1 3.25 15.5V4Zm4.25 8a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5ZM7.25 9.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Z" />
        </svg>
        {t("adminEnterTrip")}
      </Button>

      <Modal
        open={open}
        onClose={closeDialog}
        title={t("adminEnterTripTitle")}
        returnFocusRef={triggerRef}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">{t("adminEnterTripConfirmMsg")}</p>

          {error && (
            <p className="animate-toast-in text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDialog} disabled={submitting}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleEnter} disabled={submitting}>
              {submitting ? <Spinner label={t("loading")} /> : t("adminEnterTripConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
