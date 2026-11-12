import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { loadSessionData } from "@/lib/session-data";
import { fmtDate, fmtHour, vnd } from "@/lib/format";
import { statusOf } from "@/lib/payments";
import { statusBar, statusBorder } from "@/lib/status-style";
import { PaymentControls } from "./payment-controls";
import { OptimisticToggle } from "../../optimistic-toggle";
import {
  addAttendee,
  deleteSession,
  removeAttendance,
  saveAmounts,
  setArchived,
  toggleShared,
  updateAttendance,
  updateSession,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sid = Number(id);
  if (!Number.isInteger(sid)) notFound();

  const data = await loadSessionData(sid);
  if (!data) notFound();
  const { session: s, attendees, split } = data;

  const line = new Map(split.lines.map((l) => [l.id, l]));
  const unsaved = attendees.some((a) => a.amountDue !== line.get(a.id)!.total);
  const statuses = attendees.map((a) => statusOf(a.amountDue, a.amountPaid));
  const paidCount = statuses.filter((x) => x === "paid").length;
  const collected = attendees.reduce((t, a) => t + a.amountPaid, 0);
  const outstanding = attendees.reduce(
    (t, a) => t + Math.max(0, a.amountDue - a.amountPaid),
    0,
  );

  const activePlayers = await db
    .select()
    .from(players)
    .where(eq(players.isActive, true))
    .orderBy(asc(players.name));
  const available = activePlayers.filter(
    (p) => !attendees.some((a) => a.playerId === p.id),
  );

  return (
    <div className="space-y-4">
      <div>
        <Link href="/sessions" className="text-sm text-court">
          Back to sessions
        </Link>
        <h1 className="text-[22px] font-bold leading-tight">
          {fmtDate(s.date)}
        </h1>
        <p className="text-sm text-muted">
          {s.venue || "No venue"}
          {s.status === "archived" ? ", archived" : ""}
        </p>
      </div>

      {unsaved && (
        <form
          action={saveAmounts.bind(null, s.id)}
          className="flex items-center justify-between gap-3 rounded-xl bg-partial-tint p-3 text-partial"
        >
          <p className="text-sm">
            Amounts changed. Save them before taking payments or sharing cards.
          </p>
          <button className="btn btn-primary shrink-0">Save amounts</button>
        </form>
      )}

      <section className="panel p-4">
        <div className="text-sm text-muted">Collected</div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[32px] font-bold leading-tight tabular-nums">
            {vnd(collected)}
          </span>
          <span className="text-muted">of {vnd(split.totalOwed)}</span>
        </div>
        <div
          className="mt-3 flex gap-1"
          role="img"
          aria-label={`${paidCount} of ${attendees.length} paid`}
        >
          {attendees.map((a, i) => (
            <span
              key={a.id}
              title={a.name}
              className={`h-2 flex-1 rounded-full ${unsaved ? "bg-line" : statusBar[statuses[i]]}`}
            />
          ))}
        </div>
        <div className="mt-1 text-sm text-muted">
          {paidCount} of {attendees.length} paid
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
          <div>
            <dt className="text-muted">Outstanding</dt>
            <dd
              className={`text-base font-medium tabular-nums ${outstanding > 0 ? "text-unpaid" : ""}`}
            >
              {vnd(outstanding)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Spent</dt>
            <dd className="text-base font-medium tabular-nums">
              {vnd(split.totalSpent)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Surplus</dt>
            <dd
              className={`text-base font-medium tabular-nums ${split.surplus < 0 ? "text-unpaid" : "text-paid"}`}
            >
              {vnd(split.surplus)}
            </dd>
          </div>
        </dl>
      </section>

      <ul className="list">
        {attendees.map((a, i) => {
          const l = line.get(a.id)!;
          const st = statuses[i];
          const parts = (
            [
              ["court", l.court],
              ["shuttle", l.shuttle],
              ["drinks", l.drinks],
              ["snack", l.snack],
            ] as [string, number][]
          )
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${k} ${vnd(v)}`)
            .join(", ");

          return (
            <li
              key={a.id}
              className={`space-y-3 border-l-4 p-4 ${unsaved ? "border-l-line" : statusBorder[st]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[17px] font-medium">
                      {a.name}
                    </span>
                  </div>
                  <div className="text-sm text-muted">
                    {`${fmtHour(a.startHour)} to ${fmtHour(a.endHour)}, ${l.hours}h`}
                  </div>
                </div>
                <div className="text-[19px] font-bold tabular-nums">
                  {vnd(l.total)}
                </div>
              </div>

              <div className="text-sm text-muted">{parts}</div>

              {(s.drinksTotal > 0 || s.snackTotal > 0) && (
                <div className="flex flex-wrap gap-2">
                  {s.drinksTotal > 0 && (
                    <OptimisticToggle
                      initialValue={a.joinedDrinks}
                      action={toggleShared.bind(null, a.id, "joinedDrinks")}
                      onLabel="Drinks in"
                      offLabel="No drinks"
                      className="btn btn-sm"
                      onClassName="border-court bg-court-tint text-court"
                      offClassName="text-muted"
                    />
                  )}
                  {s.snackTotal > 0 && (
                    <OptimisticToggle
                      initialValue={a.joinedSnack}
                      action={toggleShared.bind(null, a.id, "joinedSnack")}
                      onLabel="Snack in"
                      offLabel="No snack"
                      className="btn btn-sm"
                      onClassName="border-court bg-court-tint text-court"
                      offClassName="text-muted"
                    />
                  )}
                </div>
              )}

              <PaymentControls
                id={a.id}
                due={a.amountDue}
                paid={a.amountPaid}
                paidAt={a.paidAt}
              />

              <details>
                <summary className="cursor-pointer text-sm text-court">
                  Hours and removal
                </summary>
                <div className="mt-3 space-y-3">
                  <form
                    action={updateAttendance.bind(null, a.id)}
                    className="grid grid-cols-2 gap-2"
                  >
                    <label>
                      <span className="label">Start</span>
                      <input
                        name="startHour"
                        type="number"
                        step={0.5}
                        defaultValue={a.startHour}
                        className="field"
                      />
                    </label>
                    <label>
                      <span className="label">End</span>
                      <input
                        name="endHour"
                        type="number"
                        step={0.5}
                        defaultValue={a.endHour}
                        className="field"
                      />
                    </label>
                    <button className="btn col-span-2">Save hours</button>
                  </form>
                  <form action={removeAttendance.bind(null, a.id)}>
                    <button className="btn btn-sm btn-danger">
                      Remove from session
                    </button>
                  </form>
                </div>
              </details>
            </li>
          );
        })}
        {attendees.length === 0 && (
          <li className="p-4 text-muted">Nobody in this session yet.</li>
        )}
      </ul>

      {available.length > 0 && (
        <form action={addAttendee.bind(null, s.id)} className="flex gap-2">
          <select name="playerId" aria-label="Player to add" className="field">
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn shrink-0">Add player</button>
        </form>
      )}

      <ul className="list">
        <li className="p-4">
          <details>
            <summary className="cursor-pointer font-medium">
              Share summary image
            </summary>
            <form
              action={`/api/export/session/${s.id}`}
              method="get"
              target="_blank"
              className="mt-3 space-y-3"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hideStatus"
                  className="size-5 accent-court"
                />{" "}
                Hide who has paid
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hideDetail"
                  className="size-5 accent-court"
                />{" "}
                Show names and totals only
              </label>
              <button className="btn btn-primary w-full">Open image</button>
            </form>
          </details>
        </li>

        <li className="p-4">
          <details>
            <summary className="cursor-pointer font-medium">
              Session numbers
            </summary>
            <form
              action={updateSession.bind(null, s.id)}
              className="mt-3 grid grid-cols-2 gap-3"
            >
              <label>
                <span className="label">Venue</span>
                <input
                  name="venue"
                  defaultValue={s.venue ?? ""}
                  className="field"
                />
              </label>
              <label>
                <span className="label">Courts</span>
                <input
                  name="courts"
                  type="number"
                  min={1}
                  defaultValue={s.courts}
                  className="field"
                />
              </label>
              <label>
                <span className="label">Court rate per hour</span>
                <input
                  name="courtRatePerHour"
                  type="number"
                  inputMode="numeric"
                  step={1000}
                  defaultValue={s.courtRatePerHour}
                  className="field"
                />
              </label>
              <label>
                <span className="label">Price per shuttle</span>
                <input
                  name="shuttlePrice"
                  type="number"
                  inputMode="numeric"
                  step={1000}
                  defaultValue={s.shuttlePrice}
                  className="field"
                />
              </label>
              <label>
                <span className="label">Shuttles used</span>
                <input
                  name="shuttlesUsed"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={s.shuttlesUsed}
                  className="field"
                />
              </label>
              <label>
                <span className="label">Drinks bill (water bucket)</span>
                <input
                  name="drinksTotal"
                  type="number"
                  inputMode="numeric"
                  step={1000}
                  defaultValue={s.drinksTotal}
                  className="field"
                />
              </label>
              <label className="col-span-2">
                <span className="label">Snack bill</span>
                <input
                  name="snackTotal"
                  type="number"
                  inputMode="numeric"
                  step={1000}
                  defaultValue={s.snackTotal}
                  className="field"
                />
              </label>
              <button className="btn btn-primary col-span-2">
                Save session numbers
              </button>
            </form>
          </details>
        </li>

        <li className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {s.status === "archived"
                ? "This session is archived."
                : outstanding > 0
                  ? `${vnd(outstanding)} is still outstanding. It stays on the dashboard after archiving.`
                  : "Everything is collected."}
            </span>
            <OptimisticToggle
              initialValue={s.status === "archived"}
              action={setArchived.bind(
                null,
                s.id,
                s.status !== "archived",
              )}
              onAction={setArchived.bind(null, s.id, true)}
              offAction={setArchived.bind(null, s.id, false)}
              onLabel="Unarchive"
              offLabel="Archive session"
              className="btn"
            />
          </div>
        </li>

        <li className="p-4">
          <details>
            <summary className="cursor-pointer font-medium text-unpaid">
              Delete session
            </summary>
            <form
              action={deleteSession.bind(null, s.id)}
              className="mt-3 space-y-2"
            >
              <p className="text-sm text-muted">
                This removes the session, its players, and their payments.
              </p>
              <button className="btn btn-danger">Delete this session</button>
            </form>
          </details>
        </li>
      </ul>
    </div>
  );
}
