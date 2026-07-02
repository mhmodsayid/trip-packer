"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";
import { Button } from "@/components/ui";

const DISMISS_KEY = "trip-packer:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneDisplay()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    setDismissed(false);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIosDevice()) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed || isStandaloneDisplay()) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div
      role="region"
      aria-label={t("installAppTitle")}
      className="border-b border-primary/15 bg-primary/5 px-4 py-2.5 safe-bottom"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          {deferredPrompt ? t("installAppHint") : t("installIosHint")}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          {deferredPrompt && (
            <Button type="button" size="sm" onClick={install}>
              {t("installApp")}
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
            {t("dismissInstall")}
          </Button>
        </div>
      </div>
    </div>
  );
}
