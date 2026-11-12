import Link from "next/link";
import { getOwing, getUnsavedSessions } from "@/lib/owing";
import { fmtDate, vnd } from "@/lib/format";
import { OwingOverview } from "./owing-overview";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const rows = await getOwing();
  const unsavedSessions = await getUnsavedSessions();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold leading-tight">Dashboard</h1>
        <Link href="/sessions/new" className="btn btn-primary">
          New session
        </Link>
      </div>

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

      <OwingOverview
        rows={rows}
        hasUnsavedSessions={unsavedSessions.length > 0}
      />
    </div>
  );
}
