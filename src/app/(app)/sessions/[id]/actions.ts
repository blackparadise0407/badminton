"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances, items, players, sessions } from "@/db/schema";
import { loadSessionData } from "@/lib/session-data";

async function requireAdmin() {
  if (!(await auth())) throw new Error("Unauthorized");
}
const toInt = (v: FormDataEntryValue | null) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const refresh = () => {
  revalidatePath("/sessions/[id]", "page");
  revalidatePath("/sessions");
  revalidatePath("/sessions");
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
      snackTotal: toInt(formData.get("snackTotal")),
    })
    .where(eq(sessions.id, id));
  refresh();
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
    .set({
      startHour,
      endHour,
      joinedSnack: formData.get("joinedSnack") === "on",
    })
    .where(eq(attendances.id, id));
  refresh();
}

export async function removeAttendance(id: number) {
  await requireAdmin();
  await db.delete(attendances).where(eq(attendances.id, id)); // items cascade
  refresh();
}

export async function addAttendee(sessionId: number, formData: FormData) {
  await requireAdmin();
  const playerId = Number(formData.get("playerId"));
  if (!Number.isInteger(playerId)) return;
  const [pl] = await db.select().from(players).where(eq(players.id, playerId));
  if (!pl) return;
  await db
    .insert(attendances)
    .values({
      sessionId,
      playerId,
      startHour: 19,
      endHour: 19 + pl.defaultHours,
    })
    .onConflictDoNothing();
  refresh();
}

export async function addDrink(
  attendanceId: number,
  label: string,
  unitPrice: number,
) {
  await requireAdmin();
  const [existing] = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.attendanceId, attendanceId),
        eq(items.label, label),
        eq(items.unitPrice, unitPrice),
      ),
    );
  if (existing) {
    await db
      .update(items)
      .set({ qty: existing.qty + 1 })
      .where(eq(items.id, existing.id));
  } else {
    await db.insert(items).values({ attendanceId, label, qty: 1, unitPrice });
  }
  refresh();
}

export async function addCustomDrink(attendanceId: number, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const price = toInt(formData.get("price"));
  if (!label || price <= 0) return;
  await addDrink(attendanceId, label, price);
}

export async function changeQty(itemId: number, delta: number) {
  await requireAdmin();
  const [it] = await db.select().from(items).where(eq(items.id, itemId));
  if (!it) return;
  const qty = it.qty + delta;
  if (qty <= 0) await db.delete(items).where(eq(items.id, itemId));
  else await db.update(items).set({ qty }).where(eq(items.id, itemId));
  refresh();
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
  refresh();
}

export async function deleteSession(id: number) {
  await requireAdmin();
  await db.delete(sessions).where(eq(sessions.id, id)); // attendances and items cascade
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function setArchived(id: number, archived: boolean) {
  await requireAdmin();
  await db
    .update(sessions)
    .set({ status: archived ? "archived" : "active" })
    .where(eq(sessions.id, id));
  refresh();
}
