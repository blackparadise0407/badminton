"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import { loadSessionData } from "@/lib/session-data";

async function requireAdmin() {
  if (!(await auth())) throw new Error("Unauthorized");
}
const toInt = (v: FormDataEntryValue | null) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
export async function updateSession(id: number, formData: FormData) {
  await requireAdmin();
  const courtRatePerHour = toInt(formData.get("courtRatePerHour"));
  if (courtRatePerHour <= 0) throw new Error("Court rate is required");
  await db
    .update(sessions)
    .set({
      venue: String(formData.get("venue") ?? "").trim() || null,
      courts: Math.max(1, toInt(formData.get("courts"))),
      courtRatePerHour,
      shuttlePrice: toInt(formData.get("shuttlePrice")),
      shuttlesUsed: toInt(formData.get("shuttlesUsed")),
      drinksTotal: toInt(formData.get("drinksTotal")),
      snackTotal: toInt(formData.get("snackTotal")),
    })
    .where(eq(sessions.id, id));
}

export async function updateAttendance(id: number, formData: FormData) {
  await requireAdmin();
  const startHour = Number(formData.get("startHour"));
  const endHour = Number(formData.get("endHour"));
  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(endHour) ||
    endHour <= startHour
  ) {
    throw new Error("End time must be after start time");
  }
  await db
    .update(attendances)
    .set({ startHour, endHour })
    .where(eq(attendances.id, id));
}

export async function removeAttendance(id: number) {
  await requireAdmin();
  await db.delete(attendances).where(eq(attendances.id, id));
}

export async function addAttendee(sessionId: number, formData: FormData) {
  await requireAdmin();
  const playerId = Number(formData.get("playerId"));
  if (!Number.isInteger(playerId)) return;
  const [pl] = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.id, playerId));
  if (!pl) return;

  const [h] = await db
    .select({
      start: sql<number | null>`min(${attendances.startHour})`,
      end: sql<number | null>`max(${attendances.endHour})`,
    })
    .from(attendances)
    .where(eq(attendances.sessionId, sessionId));
  const startHour = h?.start != null ? Number(h.start) : 19;
  const endHour = h?.end != null ? Number(h.end) : 21;

  await db
    .insert(attendances)
    .values({ sessionId, playerId, startHour, endHour })
    .onConflictDoNothing();
}

// Tap on a player row: in or out of the drinks bill / the snack bill
export async function setShared(
  id: number,
  field: "joinedDrinks" | "joinedSnack",
  value: boolean,
) {
  await requireAdmin();
  if (
    !Number.isInteger(id) ||
    (field !== "joinedDrinks" && field !== "joinedSnack") ||
    typeof value !== "boolean"
  ) {
    throw new Error("Invalid shared-item setting");
  }
  const values =
    field === "joinedDrinks"
      ? { joinedDrinks: value }
      : { joinedSnack: value };
  const [updated] = await db
    .update(attendances)
    .set(values)
    .where(eq(attendances.id, id))
    .returning({ id: attendances.id });
  if (!updated) throw new Error("Attendance not found");
}

export async function saveAmounts(sessionId: number) {
  await requireAdmin();
  const data = await loadSessionData(sessionId);
  if (!data) return;
  for (const line of data.split.lines) {
    await db
      .update(attendances)
      .set({ amountDue: line.total })
      .where(eq(attendances.id, line.id));
  }
}

export async function setArchived(id: number, archived: boolean) {
  await requireAdmin();
  await db
    .update(sessions)
    .set({ status: archived ? "archived" : "active" })
    .where(eq(sessions.id, id));
}

export async function deleteSession(id: number) {
  await requireAdmin();
  await db.delete(sessions).where(eq(sessions.id, id)); // attendances cascade
  revalidatePath("/sessions");
  redirect("/sessions");
}
