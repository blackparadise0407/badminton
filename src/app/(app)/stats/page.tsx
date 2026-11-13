"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Period } from "@/lib/stats";
import type { StatsData } from "@/lib/page-data-types";
import { PageDataState, useApiData } from "../api-data";
import { HostSettlementDashboard } from "./host-settlement-dashboard";
import { useI18n } from "../../i18n-provider";

type By = "hours" | "sessions";
const num = (n: number, language: "en" | "vi") =>
  new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-GB", {
    maximumFractionDigits: 1,
  }).format(Math.round(n * 10) / 10);

export default function StatsPage() {
  const { language, t } = useI18n();
  const searchParams = useSearchParams();
  const period: Period = searchParams.get("period") === "all" ? "all" : "month";
  const by: By = searchParams.get("by") === "sessions" ? "sessions" : "hours";
  const { data, error, loading, retry } = useApiData<StatsData>(
    `/api/app/stats?period=${period}`,
  );
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  const { rows, totalSessions, hostSettlement } = data;
  const other: By = by === "hours" ? "sessions" : "hours";
  const sorted = [...rows].sort(
    (a, b) =>
      b[by] - a[by] || b[other] - a[other] || a.name.localeCompare(b.name),
  );
  const top = sorted[0]?.[by] ?? 0;
  const totalHours = rows.reduce((t, r) => t + r.hours, 0);

  // equal scores share a rank
  const rankOf = (i: number) => {
    let j = i;
    while (j > 0 && sorted[j - 1][by] === sorted[i][by]) j--;
    return j + 1;
  };

  const href = (next: Partial<{ period: Period; by: By }>) =>
    `/stats?period=${next.period ?? period}&by=${next.by ?? by}`;
  const seg = (on: boolean) =>
    `rounded-md px-4 py-1.5 font-medium ${on ? "bg-court text-white" : "text-muted"}`;

  const monthLabel = new Date(
    `${data.today.slice(0, 7)}-01T00:00:00Z`,
  ).toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold leading-tight">{t("Stats")}</h1>
        <p className="text-sm text-muted">
          {period === "month" ? monthLabel : t("Since the first session")}
          {totalSessions > 0 &&
            `, ${t("{count} sessions and {hours} player-hours", {
              count: totalSessions,
              hours: num(totalHours, language),
            })}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
          <Link
            href={href({ period: "month" })}
            className={seg(period === "month")}
          >
            {t("This month")}
          </Link>
          <Link
            href={href({ period: "all" })}
            className={seg(period === "all")}
          >
            {t("All time")}
          </Link>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
          <Link href={href({ by: "hours" })} className={seg(by === "hours")}>
            {t("Hours")}
          </Link>
          <Link
            href={href({ by: "sessions" })}
            className={seg(by === "sessions")}
          >
            {t("Sessions")}
          </Link>
        </div>
      </div>

      <HostSettlementDashboard sessions={hostSettlement} />

      <ul className="list">
        {sorted.map((r, i) => {
          const everySession =
            totalSessions >= 2 && r.sessions === totalSessions;
          return (
            <li
              key={r.id}
              className={`space-y-2 p-4 ${r.isActive ? "" : "opacity-60"}`}
            >
              <div className="flex items-baseline gap-3">
                <span className="w-6 text-right text-sm tabular-nums text-muted">
                  {rankOf(i)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium">
                  {r.name}
                </span>
                <span className="text-[19px] font-bold tabular-nums">
                  {by === "hours" ? `${num(r.hours, language)}h` : r.sessions}
                  {by === "sessions" && (
                    <span className="text-sm font-normal text-muted">
                      {" "}{t("sessions")}
                    </span>
                  )}
                </span>
              </div>
              <div className="ml-9 h-2 rounded-full bg-court-tint" aria-hidden>
                <div
                  className="h-2 rounded-full bg-court"
                  style={{ width: `${top > 0 ? (r[by] / top) * 100 : 0}%` }}
                />
              </div>
              <div className="ml-9 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>
                  {by === "hours"
                    ? t("{count} sessions, {hours}h each", {
                        count: r.sessions,
                        hours: num(r.hours / r.sessions, language),
                      })
                    : t("{hours}h played", { hours: num(r.hours, language) })}
                </span>
                {everySession && (
                  <span className="chip bg-court-tint text-court">
                    {t("Every session")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="p-4 text-muted">
            {period === "month"
              ? t("No sessions this month yet. Check All time, or create a session after your next game.")
              : t("No sessions yet. Create one after your next game.")}
          </li>
        )}
      </ul>
    </div>
  );
}
