"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "./ui";

interface ShareLinkProps {
  url: string;
  pin: string;
}

export function ShareLink({ url, pin }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generateQr() {
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 180,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        // QR is optional
      }
    }

    generateQr();
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Share join link</h3>
        <p className="mt-1 text-sm text-muted">
          PIN: <span className="font-mono font-semibold tracking-widest">{pin}</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code for join link"
            className="mx-auto rounded-lg border border-border sm:mx-0"
            width={180}
            height={180}
          />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="break-all rounded-lg border border-border bg-slate-50 p-3 font-mono text-xs sm:text-sm">
            {url}
          </div>
          <Button onClick={handleCopy} variant="secondary" className="w-full sm:w-auto">
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
