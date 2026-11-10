import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, sessions } from "@/db/schema";
import { createSession } from "../actions";

export const dynamic = "force-dynamic";

const START_HOUR = 19;
const COLS = "grid-cols-[1.5rem_1fr_3rem_3rem_2.75rem_2.75rem]";

export default async function NewSession() {
  const [last] = await db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.id))
    .limit(1);
  const list = await db
    .select()
    .from(players)
    .where(eq(players.isActive, true))
    .orderBy(desc(players.isRegular), asc(players.name));

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return (
    <form action={createSession} className="space-y-7">
      <div>
        <Link href="/sessions" className="text-sm text-court">
          Back to sessions
        </Link>
        <h1 className="text-[22px] font-bold leading-tight">New session</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">When and where</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Date</span>
            <input
              name="date"
              type="date"
              defaultValue={today}
              required
              className="field"
            />
          </label>
          <label>
            <span className="label">Venue</span>
            <input
              name="venue"
              defaultValue={last?.venue ?? ""}
              className="field"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Costs</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Courts</span>
            <input
              name="courts"
              type="number"
              min={1}
              defaultValue={last?.courts ?? 1}
              className="field"
            />
          </label>
          <label>
            <span className="label">Court rate per hour</span>
            <input
              name="courtRatePerHour"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              defaultValue={last?.courtRatePerHour ?? ""}
              required
              className="field"
            />
          </label>
          <label>
            <span className="label">Price per shuttle</span>
            <input
              name="shuttlePrice"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              defaultValue={last?.shuttlePrice ?? ""}
              required
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
              defaultValue={0}
              className="field"
            />
          </label>
          <label>
            <span className="label">Drinks bill (water bucket)</span>
            <input
              name="drinksTotal"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              defaultValue={0}
              className="field"
            />
          </label>
          <label className="col-span-2">
            <span className="label">Snack bill (0 if none)</span>
            <input
              name="snackTotal"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              defaultValue={0}
              className="field"
            />
          </label>
        </div>
        <p className="text-sm text-muted">
          Shuttles used is tubes opened × 12, minus what is left.
        </p>
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-medium">Who played</h2>
          <span className="text-sm text-muted">
            Times are 24h, 19.5 is 7:30 pm
          </span>
        </div>
        <div className="list">
          <div
            className={`grid ${COLS} items-center gap-x-2 px-3 py-2 text-xs text-muted`}
          >
            <span />
            <span>Name</span>
            <span className="text-center">Start</span>
            <span className="text-center">End</span>
            <span className="text-center">Drinks</span>
            <span className="text-center">Snack</span>
          </div>
          {list.map((p) => (
            <div
              key={p.id}
              className={`grid ${COLS} items-center gap-x-2 px-3 py-2 has-[input[name^=in_]:checked]:bg-court-tint`}
            >
              <input
                name={`in_${p.id}`}
                type="checkbox"
                defaultChecked={p.isRegular}
                aria-label={`${p.name} played`}
                className="size-5 accent-court"
              />
              <span className="truncate">
                {p.name}
                {p.nickname ? ` (${p.nickname})` : ""}
              </span>
              <input
                name={`start_${p.id}`}
                type="number"
                step={0.5}
                min={0}
                max={24}
                defaultValue={START_HOUR}
                aria-label={`${p.name} start`}
                className="field px-1 text-center"
              />
              <input
                name={`end_${p.id}`}
                type="number"
                step={0.5}
                min={0}
                max={24}
                defaultValue={START_HOUR + p.defaultHours}
                aria-label={`${p.name} end`}
                className="field px-1 text-center"
              />
              <input
                name={`drinks_${p.id}`}
                type="checkbox"
                defaultChecked
                aria-label={`${p.name} drinks from the bucket`}
                className="size-5 justify-self-center accent-court"
              />
              <input
                name={`snack_${p.id}`}
                type="checkbox"
                aria-label={`${p.name} joined snack`}
                className="size-5 justify-self-center accent-court"
              />
            </div>
          ))}
          {list.length === 0 && (
            <p className="p-4 text-muted">Add players first.</p>
          )}
        </div>
      </section>

      <button className="btn btn-primary w-full">Create session</button>
    </form>
  );
}
