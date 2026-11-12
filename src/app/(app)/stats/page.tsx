"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Period } from "@/lib/stats";
import type { StatsData } from "@/lib/page-data-types";
import { PageDataState, useApiData } from "../api-data";

type By = "hours" | "sessions";
const num = (n: number) => String(Math.round(n * 10) / 10);

export default function StatsPage() {
  const searchParams = useSearchParams();
  const period: Period = searchParams.get("period") === "all" ? "all" : "month";
  const by: By = searchParams.get("by") === "sessions" ? "sessions" : "hours";
  const { data, error, loading, retry } = useApiData<StatsData>(
    `/api/app/stats?period=${period}`,
  );
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  const { rows, totalSessions } = data;
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

  const monthLabel = new Date(`${data.today.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold leading-tight">Stats</h1>
        <p className="text-sm text-muted">
          {period === "month" ? monthLabel : "Since the first session"}
          {totalSessions > 0 &&
            `, ${totalSessions} sessions and ${num(totalHours)} player-hours`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
          <Link
            href={href({ period: "month" })}
            className={seg(period === "month")}
          >
            This month
          </Link>
          <Link
            href={href({ period: "all" })}
            className={seg(period === "all")}
          >
            All time
          </Link>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
          <Link href={href({ by: "hours" })} className={seg(by === "hours")}>
            Hours
          </Link>
          <Link
            href={href({ by: "sessions" })}
            className={seg(by === "sessions")}
          >
            Sessions
          </Link>
        </div>
      </div>

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
                  {by === "hours" ? `${num(r.hours)}h` : r.sessions}
                  {by === "sessions" && (
                    <span className="text-sm font-normal text-muted">
                      {" "}
                      sessions
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
                    ? `${r.sessions} sessions, ${num(r.hours / r.sessions)}h each`
                    : `${num(r.hours)}h played`}
                </span>
                {everySession && (
                  <span className="chip bg-court-tint text-court">
                    Every session
                  </span>
                )}
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="p-4 text-muted">
            {period === "month"
              ? "No sessions this month yet. Check All time, or create a session after your next game."
              : "No sessions yet. Create one after your next game."}
          </li>
        )}
      </ul>
    </div>
  );
}
