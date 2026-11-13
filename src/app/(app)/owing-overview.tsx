"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { markPaid } from "@/app/(app)/payment-actions";
import { OVERDUE_DAYS } from "@/lib/payments";
import { fmtDate, vnd } from "@/lib/format";
import { refreshAfter } from "./api-data";
import { useToast } from "./toast-provider";
import { useI18n } from "../i18n-provider";

type OwingRow = {
  id: number;
  sessionId: number;
  date: string;
  name: string;
  due: number;
  paid: number;
  left: number;
  days: number;
};

function relativeDay(
  days: number,
  t: (message: string, values?: Record<string, string | number>) => string,
) {
  if (days === 0) return t("today");
  if (days === 1) return t("yesterday");
  if (days === -1) return t("tomorrow");
  if (days < 0) return t("in {days} days", { days: Math.abs(days) });
  return t("{days} days ago", { days });
}

export function OwingOverview({
  rows,
  hasUnsavedSessions,
}: {
  rows: OwingRow[];
  hasUnsavedSessions: boolean;
}) {
  const [hiddenRows, setHiddenRows] = useState<Set<number>>(
    () => new Set(),
  );
  const [pendingRows, setPendingRows] = useState<Set<number>>(
    () => new Set(),
  );
  const pendingRef = useRef(new Set<number>());
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const notify = useToast();
  const { language, t } = useI18n();
  const visibleRows = rows.filter((row) => !hiddenRows.has(row.id));

  useEffect(() => {
    setHiddenRows((current) => {
      const next = new Set(
        [...current].filter((id) => rows.some((row) => row.id === id)),
      );
      return next.size === current.size ? current : next;
    });
  }, [rows]);

  async function pay(id: number, sessionId: number) {
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setPendingRows(new Set(pendingRef.current));

    try {
      await refreshAfter(markPaid, [
        "/api/app/dashboard",
        "/api/app/sessions",
        "/api/app/sessions?*",
        `/api/app/sessions/${sessionId}`,
        "/api/app/stats*",
      ])(id);
      setHiddenRows((current) => {
        if (!rowsRef.current.some((row) => row.id === id)) return current;
        return new Set(current).add(id);
      });
    } catch {
      notify("Could not save payment. Please try again.", "error");
    } finally {
      pendingRef.current.delete(id);
      setPendingRows(new Set(pendingRef.current));
    }
  }

  const overdue = visibleRows.filter((row) => row.days >= OVERDUE_DAYS);
  const waiting = visibleRows.filter((row) => row.days < OVERDUE_DAYS);
  const sum = (items: OwingRow[]) =>
    items.reduce((total, row) => total + row.left, 0);
  const people = (count: number) =>
    t(count === 1 ? "{count} person" : "{count} people", { count });

  const section = (
    title: string,
    items: OwingRow[],
    overdueSection: boolean,
  ) =>
    items.length > 0 && (
      <section className="space-y-2">
        <h2 className={`font-medium ${overdueSection ? "text-unpaid" : ""}`}>
          {title}
        </h2>
        <ul className="list">
          {items.map((row) => (
            <li key={row.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[17px] font-medium">
                    {row.name}
                  </div>
                  <Link
                    href={`/sessions/${row.sessionId}`}
                    className="text-sm text-muted underline"
                  >
                    {[
                      fmtDate(row.date, language),
                      relativeDay(row.days, t),
                      ...(row.paid > 0 ? [t("part paid")] : []),
                    ].join(", ")}
                  </Link>
                </div>
                <div className="text-[19px] font-bold tabular-nums">
                  {vnd(row.left, language)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-paid"
                disabled={pendingRows.has(row.id)}
                onClick={() => pay(row.id, row.sessionId)}
              >
                {t(pendingRows.has(row.id) ? "Saving..." : "Paid")}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <>
      <section className="panel grid grid-cols-2 divide-x divide-line">
        <div className="p-4">
          <div className="text-sm text-muted">
            {t("Overdue after {days} days", { days: OVERDUE_DAYS })}
          </div>
          <div
            className={`text-[22px] font-bold leading-tight tabular-nums ${overdue.length ? "text-unpaid" : ""}`}
          >
            {vnd(sum(overdue), language)}
          </div>
          <div className="text-sm text-muted">{people(overdue.length)}</div>
        </div>
        <div className="p-4">
          <div className="text-sm text-muted">
            {t("Recent, not yet due")}
          </div>
          <div className="text-[22px] font-bold leading-tight tabular-nums">
            {vnd(sum(waiting), language)}
          </div>
          <div className="text-sm text-muted">{people(waiting.length)}</div>
        </div>
      </section>

      {section(t("Overdue"), overdue, true)}
      {section(t("Waiting for payment"), waiting, false)}

      {visibleRows.length === 0 && !hasUnsavedSessions && (
        <div className="panel space-y-3 p-5">
          <p className="font-medium">{t("Everyone has paid.")}</p>
          <p className="text-muted">
            {t("Create the next session after your next game.")}
          </p>
          <Link href="/sessions/new" className="btn btn-primary">
            {t("New session")}
          </Link>
        </div>
      )}
    </>
  );
}
