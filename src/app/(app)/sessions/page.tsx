import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, attendances } from "@/db/schema";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const showArchived = (await searchParams).show === "archived";

  const rows = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      venue: sessions.venue,
      count: sql<number>`count(${attendances.id})`.mapWith(Number),
      unpaid:
        sql<number>`count(*) filter (where ${attendances.amountDue} = 0 or ${attendances.amountPaid} < ${attendances.amountDue})`.mapWith(
          Number,
        ),
    })
    .from(sessions)
    .leftJoin(attendances, eq(attendances.sessionId, sessions.id))
    .where(eq(sessions.status, showArchived ? "archived" : "active"))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.date), desc(sessions.id));

  const seg = (on: boolean) =>
    `rounded-md px-4 py-1.5 font-medium ${on ? "bg-court text-white" : "text-muted"}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold leading-tight">Sessions</h1>
        <Link href="/sessions/new" className="btn btn-primary">
          New session
        </Link>
      </div>

      <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
        <Link href="/sessions" className={seg(!showArchived)}>
          Active
        </Link>
        <Link href="/sessions?show=archived" className={seg(showArchived)}>
          Archived
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
                <div className="text-[17px] font-medium">{fmtDate(s.date)}</div>
                <div className="truncate text-sm text-muted">
                  {s.venue ? `${s.venue}, ` : ""}
                  {s.count} players
                </div>
              </div>
              {s.unpaid > 0 ? (
                <span className="chip chip-unpaid">{s.unpaid} unpaid</span>
              ) : s.count > 0 ? (
                <span className="chip chip-paid">All paid</span>
              ) : null}
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="p-4 text-muted">
            {showArchived
              ? "Nothing archived yet."
              : "No sessions yet. Create one after your next game."}
          </li>
        )}
      </ul>
    </div>
  );
}
