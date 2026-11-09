"use server";

import { revalidatePath } from "next/cache";
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
  revalidatePath("/players");
}

export async function toggleFlag(id: number, field: "isRegular" | "isActive") {
  await requireAdmin();
  const [p] = await db.select().from(players).where(eq(players.id, id));
  if (!p) return;
  await db
    .update(players)
    .set({ [field]: !p[field] })
    .where(eq(players.id, id));
  revalidatePath("/players");
}

export async function setDefaultHours(id: number, formData: FormData) {
  await requireAdmin();
  const hours = Number(formData.get("defaultHours"));
  if (!Number.isFinite(hours) || hours <= 0 || hours > 12) return;
  await db
    .update(players)
    .set({ defaultHours: hours })
    .where(eq(players.id, id));
  revalidatePath("/players");
}
