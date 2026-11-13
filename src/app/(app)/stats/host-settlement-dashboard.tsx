"use client";

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useMemo, useState } from "react";
import { useEffect, useRef } from "react";
import { vnd } from "@/lib/format";
import type { HostSettlementSession } from "@/lib/host-settlement";
import { useI18n } from "../../i18n-provider";

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
);

type Grouping = "session" | "month" | "year";
type SettlementPoint = {
  label: string;
  detail: string;
  sessions: number;
  spent: number;
  collected: number;
  unpaid: number;
  balance: number;
  needsSave: number;
};

function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions,
  language: "en" | "vi",
) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    language === "vi" ? "vi-VN" : "en-GB",
    {
      ...options,
      timeZone: "UTC",
    },
  );
}

export function HostSettlementDashboard({
  sessions,
}: {
  sessions: HostSettlementSession[];
}) {
  const { language, t } = useI18n();
  const [grouping, setGrouping] = useState<Grouping>("month");
  const canvas = useRef<HTMLCanvasElement>(null);

  const points = useMemo(() => {
    if (grouping === "session") {
      return sessions.map((session) => ({
        label: dateLabel(
          session.date,
          { day: "numeric", month: "short" },
          language,
        ),
        detail: `${dateLabel(
          session.date,
          { day: "numeric", month: "long", year: "numeric" },
          language,
        )} · ${t("Session")} #${session.id}`,
        sessions: 1,
        spent: session.spent,
        collected: session.collected,
        unpaid: session.unpaid,
        balance: session.balance,
        needsSave: Number(session.needsSave),
      }));
    }

    const totals = new Map<string, SettlementPoint>();
    for (const session of sessions) {
      const key =
        grouping === "month" ? session.date.slice(0, 7) : session.date.slice(0, 4);
      const current = totals.get(key) ?? {
        label: "",
        detail: "",
        sessions: 0,
        spent: 0,
        collected: 0,
        unpaid: 0,
        balance: 0,
        needsSave: 0,
      };
      current.sessions++;
      current.spent += session.spent;
      current.collected += session.collected;
      current.unpaid += session.unpaid;
      current.balance += session.balance;
      current.needsSave += Number(session.needsSave);
      totals.set(key, current);
    }

    return Array.from(totals, ([key, point]) => {
      const date = `${key}${grouping === "month" ? "-01" : "-01-01"}`;
      const label =
        grouping === "month"
          ? dateLabel(date, { month: "short", year: "numeric" }, language)
          : key;
      return { ...point, label, detail: label };
    });
  }, [grouping, language, sessions, t]);

  const totals = sessions.reduce(
    (sum, session) => ({
      spent: sum.spent + session.spent,
      collected: sum.collected + session.collected,
      unpaid: sum.unpaid + session.unpaid,
      balance: sum.balance + session.balance,
      needsSave: sum.needsSave + Number(session.needsSave),
    }),
    { spent: 0, collected: 0, unpaid: 0, balance: 0, needsSave: 0 },
  );

  useEffect(() => {
    if (!canvas.current || points.length === 0) return;

    const chart = new ChartJS(canvas.current, {
      type: "bar",
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            label: t("Expenses"),
            data: points.map((point) => point.spent),
            backgroundColor: "#1f5c99",
            borderRadius: 5,
            maxBarThickness: 32,
          },
          {
            label: t("Collected"),
            data: points.map((point) => point.collected),
            backgroundColor: "#16703b",
            borderRadius: 5,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              title: (items) => points[items[0].dataIndex]?.detail ?? "",
              label: (item) =>
                item.parsed.y === null
                  ? ""
                  : `${item.dataset.label}: ${vnd(item.parsed.y, language)}`,
              afterBody: (items) => {
                const point = items[0] && points[items[0].dataIndex];
                if (!point) return [];
                const balanceLabel =
                  point.balance > 0
                    ? t("Still fronting")
                    : point.balance < 0
                      ? t("Surplus")
                      : t("Settled");
                return [
                  `${t("Unpaid")}: ${vnd(point.unpaid, language)}`,
                  `${balanceLabel}: ${vnd(Math.abs(point.balance), language)}`,
                  ...(point.needsSave > 0
                    ? [
                        t("{count} session(s) need dues saved", {
                          count: point.needsSave,
                        }),
                      ]
                    : []),
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0 },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat(
                  language === "vi" ? "vi-VN" : "en-US",
                  {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  },
                ).format(Number(value)),
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [language, points, t]);

  const buttonClass = (selected: boolean) =>
    `rounded-md px-3 py-1.5 font-medium ${
      selected ? "bg-court text-white" : "text-muted"
    }`;

  return (
    <section className="panel space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t("Host settlement")}</h2>
          <p className="text-sm text-muted">
            {t("All-time expenses, collections, and balance")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { label: t("Expenses"), amount: totals.spent, color: "text-ink" },
            { label: t("Collected"), amount: totals.collected, color: "text-ink" },
            { label: t("Unpaid"), amount: totals.unpaid, color: "text-unpaid" },
            {
              label: t(
                totals.balance > 0
                  ? "Still fronting"
                  : totals.balance < 0
                    ? "Surplus"
                    : "Settled",
              ),
              amount: Math.abs(totals.balance),
              color:
                totals.balance > 0
                  ? "text-unpaid"
                  : totals.balance < 0
                    ? "text-paid"
                    : "text-ink",
            },
          ] satisfies { label: string; amount: number; color: string }[]
        ).map(({ label, amount, color }) => (
          <div key={label} className="rounded-lg bg-floor p-3">
            <div className="text-xs text-muted">{label}</div>
            <div className={`font-semibold tabular-nums ${color}`}>
              {vnd(amount, language)}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        {t("Unpaid dues use current splits. Sessions with unsaved dues are flagged.")}
      </p>

      <div
        className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm"
        aria-label={t("Group host settlement")}
      >
        {(["session", "month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={buttonClass(grouping === value)}
            aria-pressed={grouping === value}
            onClick={() => setGrouping(value)}
          >
            {value === "session"
              ? t("Session")
              : value === "month"
                ? t("Month")
                : t("Year")}
          </button>
        ))}
      </div>

      {points.length > 0 ? (
        <>
          <div className="h-60">
            <canvas
              ref={canvas}
              role="img"
              aria-label={t("Expenses and collections by {grouping}", {
                grouping: t(
                  grouping === "session"
                    ? "Session"
                    : grouping === "month"
                      ? "Month"
                      : "Year",
                ),
              })}
            />
          </div>
          <details className="rounded-lg border border-line">
            <summary className="cursor-pointer p-3 text-sm font-medium">
              {t("Detailed breakdown ({count})", { count: points.length })}
            </summary>
            <ul className="divide-y divide-line">
              {points.map((point) => {
                const balanceLabel =
                  point.balance > 0
                    ? t("Still fronting")
                    : point.balance < 0
                      ? t("Surplus")
                      : t("Settled");
                return (
                  <li key={point.detail} className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{point.detail}</span>
                      {point.needsSave > 0 && (
                        <span className="chip bg-partial-tint text-partial">
                          {point.needsSave === 1
                            ? t("Dues not saved")
                            : t("{count} dues not saved", {
                                count: point.needsSave,
                              })}
                        </span>
                      )}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <div>
                        <dt className="text-muted">{t("Expenses")}</dt>
                        <dd className="tabular-nums">
                          {vnd(point.spent, language)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">{t("Collected")}</dt>
                        <dd className="tabular-nums">
                          {vnd(point.collected, language)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">{t("Unpaid")}</dt>
                        <dd className="tabular-nums">
                          {vnd(point.unpaid, language)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">{balanceLabel}</dt>
                        <dd className="tabular-nums">
                          {vnd(Math.abs(point.balance), language)}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-muted">
          {t("No sessions recorded yet.")}
        </p>
      )}
    </section>
  );
}
