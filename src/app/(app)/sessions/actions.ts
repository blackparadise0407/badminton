"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { players, sessions, attendances } from "@/db/schema";

const toInt = (v: FormDataEntryValue | null) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export async function createSession(formData: FormData) {
  if (!(await auth())) throw new Error("Unauthorized");

  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date");

  const courtRatePerHour = toInt(formData.get("courtRatePerHour"));
  const shuttlePrice = toInt(formData.get("shuttlePrice"));
  if (courtRatePerHour <= 0) throw new Error("Court rate is required");

  // Read the ticked players
  const allPlayers = await db.select({ id: players.id }).from(players);
  const rows: Omit<typeof attendances.$inferInsert, "sessionId">[] = [];
  for (const p of allPlayers) {
    if (formData.get(`in_${p.id}`) !== "on") continue;
    const startHour = Number(formData.get(`start_${p.id}`));
    const endHour = Number(formData.get(`end_${p.id}`));
    if (
      !Number.isFinite(startHour) ||
      !Number.isFinite(endHour) ||
      endHour <= startHour
    ) {
      throw new Error("Each player's end time must be after their start time");
    }
    rows.push({
      playerId: p.id,
      startHour,
      endHour,
      joinedDrinks: formData.get(`drinks_${p.id}`) === "on",
      joinedSnack: formData.get(`snack_${p.id}`) === "on",
    });
  }
  if (rows.length === 0) throw new Error("Pick at least one player");

  const [created] = await db
    .insert(sessions)
    .values({
      date,
      venue: String(formData.get("venue") ?? "").trim() || null,
      courts: Math.max(1, toInt(formData.get("courts"))),
      courtRatePerHour,
      shuttlePrice,
      shuttlesUsed: toInt(formData.get("shuttlesUsed")),
      snackTotal: toInt(formData.get("snackTotal")),
      drinksTotal: toInt(formData.get("drinksTotal")),
    })
    .returning({ id: sessions.id });

  try {
    await db
      .insert(attendances)
      .values(rows.map((r) => ({ ...r, sessionId: created.id })));
  } catch (e) {
    // Neon's HTTP driver has no transactions, so clean up by hand
    await db.delete(sessions).where(eq(sessions.id, created.id));
    throw e;
  }

  redirect(`/sessions/${created.id}`);
}
