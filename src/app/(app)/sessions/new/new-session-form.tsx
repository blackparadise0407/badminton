"use client";

import { useState } from "react";
import Link from "next/link";
import { createSession } from "../actions";
import { refreshAfter } from "../../api-data";

type P = {
  id: number;
  name: string;
  nickname: string | null;
  isRegular: boolean;
};
type Defaults = {
  date: string;
  venue: string;
  courts: number;
  courtRatePerHour: number | "";
  shuttlePrice: number | "";
  startHour: number;
  endHour: number;
};

const COLS = "grid-cols-[1.5rem_1fr_3rem_3rem_2.75rem_2.75rem]";

export function NewSessionForm({
  players,
  defaults,
}: {
  players: P[];
  defaults: Defaults;
}) {
  const [start, setStart] = useState(String(defaults.startHour));
  const [end, setEnd] = useState(String(defaults.endHour));
  // only the hours someone changed by hand; everything else follows the session hours
  const [over, setOver] = useState<Record<string, string>>({});

  const sessionBad = !(Number(end) > Number(start));
  const setOverride = (key: string, v: string) =>
    setOver((o) => ({ ...o, [key]: v }));

  return (
    <form action={refreshAfter(createSession)} className="space-y-7">
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
              defaultValue={defaults.date}
              required
              className="field"
            />
          </label>
          <label>
            <span className="label">Venue</span>
            <input
              name="venue"
              defaultValue={defaults.venue}
              className="field"
            />
          </label>
          <label>
            <span className="label">Session start</span>
            <input
              type="number"
              step={0.5}
              min={0}
              max={24}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="field"
            />
          </label>
          <label>
            <span className="label">Session end</span>
            <input
              type="number"
              step={0.5}
              min={0}
              max={24}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="field"
            />
          </label>
        </div>
        <p className={`text-sm ${sessionBad ? "text-unpaid" : "text-muted"}`}>
          {sessionBad
            ? "End must be later than start."
            : "Everyone gets these hours. Adjust individual players below. Times are 24h, 19.5 is 7:30 pm."}
        </p>
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
              defaultValue={defaults.courts}
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
              defaultValue={defaults.courtRatePerHour}
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
              defaultValue={defaults.shuttlePrice}
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
          <label>
            <span className="label">Snack bill</span>
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
        <h2 className="font-medium">Who played</h2>
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
          {players.map((p) => {
            const sKey = `start_${p.id}`;
            const eKey = `end_${p.id}`;
            const s = over[sKey] ?? start;
            const e = over[eKey] ?? end;
            const bad = !(Number(e) > Number(s));
            const cls = (key: string) =>
              `field px-1 text-center ${bad ? "border-unpaid" : key in over ? "border-court" : ""}`;

            return (
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
                  name={sKey}
                  type="number"
                  step={0.5}
                  min={0}
                  max={24}
                  value={s}
                  onChange={(ev) => setOverride(sKey, ev.target.value)}
                  aria-label={`${p.name} start`}
                  aria-invalid={bad}
                  className={cls(sKey)}
                />
                <input
                  name={eKey}
                  type="number"
                  step={0.5}
                  min={0}
                  max={24}
                  value={e}
                  onChange={(ev) => setOverride(eKey, ev.target.value)}
                  aria-label={`${p.name} end`}
                  aria-invalid={bad}
                  className={cls(eKey)}
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
            );
          })}
          {players.length === 0 && (
            <p className="p-4 text-muted">Add players first.</p>
          )}
        </div>
        <p className="text-sm text-muted">
          A blue border means you changed that player's hours by hand.
        </p>
      </section>

      <button className="btn btn-primary w-full" disabled={sessionBad}>
        Create session
      </button>
    </form>
  );
}
