"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { fmtDate, fmtHour, vnd } from "@/lib/format";
import { statusOf } from "@/lib/payments";
import { statusBar, statusBorder } from "@/lib/status-style";
import type { SessionDetailData } from "@/lib/page-data-types";
import { PaymentControls } from "./payment-controls";
import { OptimisticToggle } from "../../optimistic-toggle";
import { PageDataState, refreshAfter, useApiData } from "../../api-data";
import { useI18n } from "../../../i18n-provider";
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

export default function SessionDetail() {
  const { language, t } = useI18n();
  const money = (amount: number) => vnd(amount, language);
  const { id } = useParams<{ id: string }>();
  const sid = Number(id);
  const { data, error, loading, retry } = useApiData<SessionDetailData>(
    `/api/app/sessions/${id}`,
  );
  if (!Number.isInteger(sid)) {
    return (
      <p role="alert" className="text-unpaid">
        {t("Invalid session id.")}
      </p>
    );
  }
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  const { session: s, attendees, split, activePlayers } = data;

  const line = new Map(split.lines.map((l) => [l.id, l]));
  const unsaved = attendees.some((a) => a.amountDue !== line.get(a.id)!.total);
  const statuses = attendees.map((a) => statusOf(a.amountDue, a.amountPaid));
  const paidCount = statuses.filter((x) => x === "paid").length;
  const collected = attendees.reduce((t, a) => t + a.amountPaid, 0);
  const outstanding = attendees.reduce(
    (t, a) => t + Math.max(0, a.amountDue - a.amountPaid),
    0,
  );

  const available = activePlayers.filter(
    (p) => !attendees.some((a) => a.playerId === p.id),
  );

  return (
    <div className="space-y-4">
      <div>
        <Link href="/sessions" className="text-sm text-court">
          {t("Back to sessions")}
        </Link>
        <h1 className="text-[22px] font-bold leading-tight">
          {fmtDate(s.date, language)}
        </h1>
        <p className="text-sm text-muted">
          {s.venue || "No venue"}
          {s.status === "archived" ? `, ${t("Archived").toLowerCase()}` : ""}
        </p>
      </div>

      {unsaved && (
        <form
          action={refreshAfter(saveAmounts.bind(null, s.id))}
          className="flex items-center justify-between gap-3 rounded-xl bg-partial-tint p-3 text-partial"
        >
          <p className="text-sm">
            {t("Amounts changed. Save them before taking payments or sharing cards.")}
          </p>
          <button className="btn btn-primary shrink-0">
            {t("Save amounts")}
          </button>
        </form>
      )}

      <section className="panel p-4">
        <div className="text-sm text-muted">{t("Collected")}</div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[32px] font-bold leading-tight tabular-nums">
            {money(collected)}
          </span>
          <span className="text-muted">
            {t("of {amount}", { amount: money(split.totalOwed) })}
          </span>
        </div>
        <div
          className="mt-3 flex gap-1"
          role="img"
          aria-label={t("{paid} of {total} paid", {
            paid: paidCount,
            total: attendees.length,
          })}
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
          {t("{paid} of {total} paid", {
            paid: paidCount,
            total: attendees.length,
          })}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
          <div>
            <dt className="text-muted">{t("Outstanding")}</dt>
            <dd
              className={`text-base font-medium tabular-nums ${outstanding > 0 ? "text-unpaid" : ""}`}
            >
              {money(outstanding)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("Spent")}</dt>
            <dd className="text-base font-medium tabular-nums">
              {money(split.totalSpent)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("Surplus")}</dt>
            <dd
              className={`text-base font-medium tabular-nums ${split.surplus < 0 ? "text-unpaid" : "text-paid"}`}
            >
              {money(split.surplus)}
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
            .map(([k, v]) => `${t(k)} ${money(v)}`)
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
                    {t("{start} to {end}, {hours}h", {
                      start: fmtHour(a.startHour),
                      end: fmtHour(a.endHour),
                      hours: l.hours,
                    })}
                  </div>
                </div>
                <div className="text-[19px] font-bold tabular-nums">
                  {money(l.total)}
                </div>
              </div>

              <div className="text-sm text-muted">{parts}</div>

              {(s.drinksTotal > 0 || s.snackTotal > 0) && (
                <div className="flex flex-wrap gap-2">
                  {s.drinksTotal > 0 && (
                    <OptimisticToggle
                      initialValue={a.joinedDrinks}
                      action={toggleShared.bind(null, a.id, "joinedDrinks")}
                      onLabel={t("Drinks in")}
                      offLabel={t("No drinks")}
                      className="btn btn-sm"
                      onClassName="border-court bg-court-tint text-court"
                      offClassName="text-muted"
                    />
                  )}
                  {s.snackTotal > 0 && (
                    <OptimisticToggle
                      initialValue={a.joinedSnack}
                      action={toggleShared.bind(null, a.id, "joinedSnack")}
                      onLabel={t("Snack in")}
                      offLabel={t("No snack")}
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
                  {t("Hours and removal")}
                </summary>
                <div className="mt-3 space-y-3">
                  <form
                    action={refreshAfter(updateAttendance.bind(null, a.id))}
                    className="grid grid-cols-2 gap-2"
                  >
                    <label>
                      <span className="label">{t("Start")}</span>
                      <input
                        name="startHour"
                        type="number"
                        step={0.5}
                        defaultValue={a.startHour}
                        className="field"
                      />
                    </label>
                    <label>
                      <span className="label">{t("End")}</span>
                      <input
                        name="endHour"
                        type="number"
                        step={0.5}
                        defaultValue={a.endHour}
                        className="field"
                      />
                    </label>
                    <button className="btn col-span-2">
                      {t("Save hours")}
                    </button>
                  </form>
                  <form action={refreshAfter(removeAttendance.bind(null, a.id))}>
                    <button className="btn btn-sm btn-danger">
                      {t("Remove from session")}
                    </button>
                  </form>
                </div>
              </details>
            </li>
          );
        })}
        {attendees.length === 0 && (
          <li className="p-4 text-muted">
            {t("Nobody in this session yet.")}
          </li>
        )}
      </ul>

      {available.length > 0 && (
        <form
          action={refreshAfter(addAttendee.bind(null, s.id))}
          className="flex gap-2"
        >
          <select name="playerId"           aria-label={t("Player to add")} className="field">
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn shrink-0">{t("Add player")}</button>
        </form>
      )}

      <ul className="list">
        <li className="p-4">
          <details>
            <summary className="cursor-pointer font-medium">
              {t("Share summary image")}
            </summary>
            <form
              action={`/sessions/${s.id}/share`}
              method="get"
              className="mt-3 space-y-3"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hideStatus"
                  className="size-5 accent-court"
                />{" "}
                {t("Hide who has paid")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hideDetail"
                  className="size-5 accent-court"
                />{" "}
                {t("Show names and totals only")}
              </label>
              <button className="btn btn-primary w-full">
                {t("Preview image")}
              </button>
            </form>
          </details>
        </li>

        <li className="p-4">
          <details>
            <summary className="cursor-pointer font-medium">
              {t("Session numbers")}
            </summary>
            <form
              action={refreshAfter(updateSession.bind(null, s.id))}
              className="mt-3 grid grid-cols-2 gap-3"
            >
              <label>
                <span className="label">{t("Venue")}</span>
                <input
                  name="venue"
                  defaultValue={s.venue ?? ""}
                  className="field"
                />
              </label>
              <label>
                <span className="label">{t("Courts")}</span>
                <input
                  name="courts"
                  type="number"
                  min={1}
                  defaultValue={s.courts}
                  className="field"
                />
              </label>
              <label>
                <span className="label">{t("Court rate per hour")}</span>
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
                <span className="label">{t("Price per shuttle")}</span>
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
                <span className="label">{t("Shuttles used")}</span>
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
                <span className="label">{t("Drinks bill (water bucket)")}</span>
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
                <span className="label">{t("Snack bill")}</span>
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
                {t("Save session numbers")}
              </button>
            </form>
          </details>
        </li>

        <li className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {s.status === "archived"
                ? t("This session is archived.")
                : outstanding > 0
                  ? t(
                      "{amount} is still outstanding. It stays on the dashboard after archiving.",
                      { amount: money(outstanding) },
                    )
                  : t("Everything is collected.")}
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
              onLabel={t("Unarchive")}
              offLabel={t("Archive session")}
              className="btn"
            />
          </div>
        </li>

        <li className="p-4">
          <details>
            <summary className="cursor-pointer font-medium text-unpaid">
              {t("Delete session")}
            </summary>
            <form
              action={deleteSession.bind(null, s.id)}
              className="mt-3 space-y-2"
            >
              <p className="text-sm text-muted">
                {t("This removes the session, its players, and their payments.")}
              </p>
              <button className="btn btn-danger">
                {t("Delete this session")}
              </button>
            </form>
          </details>
        </li>
      </ul>
    </div>
  );
}
