"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { markPaid } from "@/app/(app)/payment-actions";
import { OVERDUE_DAYS } from "@/lib/payments";
import { fmtDate, vnd } from "@/lib/format";
import { useToast } from "./toast-provider";

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

function relativeDay(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (days < 0) return `in ${Math.abs(days)} days`;
  return `${days} days ago`;
}

export function OwingOverview({
  rows,
  hasUnsavedSessions,
}: {
  rows: OwingRow[];
  hasUnsavedSessions: boolean;
}) {
  const [visibleRows, markOptimisticallyPaid] = useOptimistic(
    rows,
    (currentRows, id: number) => currentRows.filter((row) => row.id !== id),
  );
  const [pending, startTransition] = useTransition();
  const notify = useToast();

  function pay(id: number) {
    startTransition(async () => {
      markOptimisticallyPaid(id);
      try {
        await markPaid(id);
      } catch {
        notify("Could not save the payment. The row has been restored.", "error");
      }
    });
  }

  const overdue = visibleRows.filter((row) => row.days >= OVERDUE_DAYS);
  const waiting = visibleRows.filter((row) => row.days < OVERDUE_DAYS);
  const sum = (items: OwingRow[]) =>
    items.reduce((total, row) => total + row.left, 0);
  const people = (count: number) =>
    `${count} ${count === 1 ? "person" : "people"}`;

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
                    {`${fmtDate(row.date)}, ${relativeDay(row.days)}${row.paid > 0 ? ", part paid" : ""}`}
                  </Link>
                </div>
                <div className="text-[19px] font-bold tabular-nums">
                  {vnd(row.left)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-paid"
                disabled={pending}
                onClick={() => pay(row.id)}
              >
                {pending ? "Saving..." : "Paid"}
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
            {`Overdue after ${OVERDUE_DAYS} days`}
          </div>
          <div
            className={`text-[22px] font-bold leading-tight tabular-nums ${overdue.length ? "text-unpaid" : ""}`}
          >
            {vnd(sum(overdue))}
          </div>
          <div className="text-sm text-muted">{people(overdue.length)}</div>
        </div>
        <div className="p-4">
          <div className="text-sm text-muted">Recent, not yet due</div>
          <div className="text-[22px] font-bold leading-tight tabular-nums">
            {vnd(sum(waiting))}
          </div>
          <div className="text-sm text-muted">{people(waiting.length)}</div>
        </div>
      </section>

      {section("Overdue", overdue, true)}
      {section("Waiting for payment", waiting, false)}

      {visibleRows.length === 0 && !hasUnsavedSessions && (
        <div className="panel space-y-3 p-5">
          <p className="font-medium">Everyone has paid.</p>
          <p className="text-muted">
            Create the next session after your next game.
          </p>
          <Link href="/sessions/new" className="btn btn-primary">
            New session
          </Link>
        </div>
      )}
    </>
  );
}
