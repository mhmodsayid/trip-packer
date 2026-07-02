"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getStoredLocale,
  localeDirection,
  translate,
  translateError,
  type ErrorKey,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  te: (code: ErrorKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const dir = localeDirection(locale);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir, ready]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      te: (code) => translateError(locale, code),
    }),
    [locale, dir, setLocale]
  );

  return (
    <LanguageContext.Provider value={value}>
      <div className="min-h-dvh safe-bottom" dir={dir}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useTranslation() {
  const { t, te, locale, dir, setLocale } = useLanguage();
  return { t, te, locale, dir, setLocale };
}
