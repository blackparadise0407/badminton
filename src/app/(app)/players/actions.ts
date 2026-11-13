"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { players } from "@/db/schema";

async function requireAdmin() {
  if (!(await auth())) throw new Error("Unauthorized");
}

export async function addPlayer(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const hours = Number(formData.get("defaultHours")) || 2;

  await db.insert(players).values({
    name,
    nickname,
    defaultHours: hours,
    isRegular: formData.get("isRegular") === "on",
  });
}

export async function setPlayerFlag(
  id: number,
  field: "isRegular" | "isActive",
  value: boolean,
) {
  await requireAdmin();
  if (
    !Number.isInteger(id) ||
    (field !== "isRegular" && field !== "isActive") ||
    typeof value !== "boolean"
  ) {
    throw new Error("Invalid player flag");
  }
  const values = field === "isRegular" ? { isRegular: value } : { isActive: value };
  const [updated] = await db
    .update(players)
    .set(values)
    .where(eq(players.id, id))
    .returning({ id: players.id });
  if (!updated) throw new Error("Player not found");
}

export async function setDefaultHours(id: number, formData: FormData) {
  await requireAdmin();
  const hours = Number(formData.get("defaultHours"));
  if (!Number.isFinite(hours) || hours <= 0 || hours > 12) return;
  await db
    .update(players)
    .set({ defaultHours: hours })
    .where(eq(players.id, id));
}
