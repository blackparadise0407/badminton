"use client";

import Link from "next/link";
import { fmtDate, vnd } from "@/lib/format";
import type { DashboardData } from "@/lib/page-data-types";
import { PageDataState, useApiData } from "./api-data";
import { OwingOverview } from "./owing-overview";
import { useI18n } from "../i18n-provider";

export default function Dashboard() {
  const { language, t } = useI18n();
  const { data, error, loading, retry } =
    useApiData<DashboardData>("/api/app/dashboard");
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  const { rows, unsavedSessions } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold leading-tight">
          {t("Dashboard")}
        </h1>
        <Link href="/sessions/new" className="btn btn-primary">
          {t("New session")}
        </Link>
      </div>

      {unsavedSessions.length > 0 && (
        <div className="rounded-xl bg-partial-tint p-3 text-sm text-partial">
          {t("Amounts are not saved for")}{" "}
          {unsavedSessions.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ", "}
              <Link
                href={`/sessions/${s.id}`}
                className="font-medium underline"
              >
                {fmtDate(s.date, language)}
              </Link>
            </span>
          ))}
          . {t("Those players won't show up below until you save.")}
        </div>
      )}

      <OwingOverview
        rows={rows}
        hasUnsavedSessions={unsavedSessions.length > 0}
      />
    </div>
  );
}
