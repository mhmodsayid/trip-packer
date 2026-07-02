"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LanguageProvider";
import { Button } from "@/components/ui";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const CLOSE_MS = 200;

export function Modal({
  open,
  onClose,
  title,
  children,
  returnFocusRef,
}: ModalProps) {
  const { t, dir } = useTranslation();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (mounted) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, CLOSE_MS);
      return () => window.clearTimeout(timer);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || closing) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, closing, handleClose]);

  useEffect(() => {
    if (mounted) return;
    const focusTarget = returnFocusRef?.current ?? previousFocusRef.current;
    focusTarget?.focus();
  }, [mounted, returnFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      dir={dir}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 backdrop-blur-[1px] ${
          closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in"
        }`}
        aria-label={t("close")}
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-card shadow-xl sm:max-h-[85dvh] sm:rounded-2xl ${
          closing ? "animate-modal-panel-out" : "animate-modal-panel-in"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label={t("close")}
            className="shrink-0 px-2"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </Button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
