"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  translate,
  type Language,
  type TranslationValues,
} from "@/lib/i18n";

const LANGUAGE_KEY = "badminton-language";
type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (message: string, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    const next: Language = saved === "vi" ? "vi" : "en";
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);

  const setLanguage = useCallback((next: Language) => {
    localStorage.setItem(LANGUAGE_KEY, next);
    document.documentElement.lang = next;
    setLanguageState(next);
  }, []);
  const t = useCallback(
    (message: string, values?: TranslationValues) =>
      translate(language, message, values),
    [language],
  );
  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className="inline-flex rounded-lg border border-line bg-paper p-1 text-xs"
      role="group"
      aria-label={t("Language")}
    >
      {(["en", "vi"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={`rounded-md px-2.5 py-1 font-medium ${
            language === value ? "bg-court text-white" : "text-muted"
          }`}
          aria-label={t(
            value === "en" ? "Switch to English" : "Switch to Vietnamese",
          )}
          aria-pressed={language === value}
          onClick={() => setLanguage(value)}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
