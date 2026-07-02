"use client";

import { useEffect, useState } from "react";
import { formatLockTime, getLockRemainingMs } from "@/lib/attempts";
import { useTranslation } from "@/components/LanguageProvider";

export function useJoinLockout() {
  const { t } = useTranslation();
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const tick = () => setRemainingMs(getLockRemainingMs());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const locked = remainingMs > 0;
  const timeLabel = formatLockTime(remainingMs);
  const message = locked ? t("tooManyAttempts", { time: timeLabel }) : null;

  return { locked, remainingMs, timeLabel, message };
}

export function JoinLockoutNotice({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      className="animate-toast-in rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
