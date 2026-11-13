"use client";

import { useI18n } from "../i18n-provider";

export default function Loading() {
  const { t } = useI18n();
  return (
    <div className="space-y-5" role="status" aria-label={t("Loading page")}>
      <span className="sr-only">{t("Loading page")}</span>
      <div className="h-7 w-40 animate-pulse rounded bg-line" />
      <div className="h-24 animate-pulse rounded-xl bg-line" />
      <div className="h-40 animate-pulse rounded-xl bg-line" />
    </div>
  );
}
