"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fmtDate } from "@/lib/format";
import type { SessionListRow } from "@/lib/page-data-types";
import { PageDataState, useApiData } from "../api-data";
import { useI18n } from "../../i18n-provider";

export default function SessionsPage() {
  const { language, t } = useI18n();
  const showArchived = useSearchParams().get("show") === "archived";
  const path = `/api/app/sessions${showArchived ? "?show=archived" : ""}`;
  const { data, error, loading, retry } = useApiData<SessionListRow[]>(path);
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  const rows = data;

  const seg = (on: boolean) =>
    `rounded-md px-4 py-1.5 font-medium ${on ? "bg-court text-white" : "text-muted"}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold leading-tight">
          {t("Sessions")}
        </h1>
        <Link href="/sessions/new" className="btn btn-primary">
          {t("New session")}
        </Link>
      </div>

      <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
        <Link href="/sessions" className={seg(!showArchived)}>
          {t("Active")}
        </Link>
        <Link href="/sessions?show=archived" className={seg(showArchived)}>
          {t("Archived")}
        </Link>
      </div>

      <ul className="list">
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              href={`/sessions/${s.id}`}
              className="flex items-center justify-between gap-3 p-4 active:bg-floor"
            >
              <div className="min-w-0">
                <div className="text-[17px] font-medium">
                  {fmtDate(s.date, language)}
                </div>
                <div className="truncate text-sm text-muted">
                  {s.venue ? `${s.venue}, ` : ""}
                  {t("{count} players", { count: s.count })}
                </div>
              </div>
              {s.unpaid > 0 ? (
                <span className="chip chip-unpaid">
                  {t("{count} unpaid", { count: s.unpaid })}
                </span>
              ) : s.count > 0 ? (
                <span className="chip chip-paid">{t("All paid")}</span>
              ) : null}
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="p-4 text-muted">
            {showArchived
              ? t("Nothing archived yet.")
              : t("No sessions yet. Create one after your next game.")}
          </li>
        )}
      </ul>
    </div>
  );
}
