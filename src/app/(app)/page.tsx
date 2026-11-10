import Link from "next/link";
import { markPaid } from "@/app/(app)/payment-actions";
import { OVERDUE_DAYS } from "@/lib/payments";
import { getOwing, getUnsavedSessions } from "@/lib/owing";
import { fmtDate, vnd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const rows = await getOwing();
  const unsavedSessions = await getUnsavedSessions();

  const overdue = rows.filter((r) => r.days >= OVERDUE_DAYS);
  const waiting = rows.filter((r) => r.days < OVERDUE_DAYS);
  const sum = (xs: typeof rows) => xs.reduce((t, r) => t + r.left, 0);
  const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
  const ago = (d: number) =>
    d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;

  const Row = ({ r }: { r: (typeof rows)[number] }) => (
    <li className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[17px] font-medium">{r.name}</div>
          <Link
            href={`/sessions/${r.sessionId}`}
            className="text-sm text-muted underline"
          >
            {`${fmtDate(r.date)}, ${ago(r.days)}${r.paid > 0 ? ", part paid" : ""}`}
          </Link>
        </div>
        <div className="text-[19px] font-bold tabular-nums">{vnd(r.left)}</div>
      </div>
      <div className="flex gap-2">
        <form action={markPaid.bind(null, r.id)}>
          <button className="btn btn-paid">Paid</button>
        </form>
      </div>
    </li>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold leading-tight">Dashboard</h1>
        <Link href="/sessions/new" className="btn btn-primary">
          New session
        </Link>
      </div>

      <section className="panel grid grid-cols-2 divide-x divide-line">
        <div className="p-4">
          <div className="text-sm text-muted">{`Overdue after ${OVERDUE_DAYS} days`}</div>
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

      {unsavedSessions.length > 0 && (
        <div className="rounded-xl bg-partial-tint p-3 text-sm text-partial">
          Amounts are not saved for{" "}
          {unsavedSessions.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ", "}
              <Link
                href={`/sessions/${s.id}`}
                className="font-medium underline"
              >
                {fmtDate(s.date)}
              </Link>
            </span>
          ))}
          . Those players won't show up below until you save.
        </div>
      )}

      {overdue.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium text-unpaid">Overdue</h2>
          <ul className="list">
            {overdue.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Waiting for payment</h2>
          <ul className="list">
            {waiting.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </section>
      )}

      {rows.length === 0 && unsavedSessions.length === 0 && (
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
    </div>
  );
}
