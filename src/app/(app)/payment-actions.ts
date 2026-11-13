"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances } from "@/db/schema";

async function requireAdmin() {
  if (!(await auth())) throw new Error("Unauthorized");
}
async function getSaved(id: number) {
  const [a] = await db.select().from(attendances).where(eq(attendances.id, id));
  if (!a) throw new Error("Not found");
  if (a.amountDue <= 0) throw new Error("Save the session amounts first");
  return a;
}

export async function markPaid(id: number) {
  await requireAdmin();
  const [updated] = await db
    .update(attendances)
    .set({
      amountPaid: sql`${attendances.amountDue}`,
      paidAt: new Date(),
    })
    .where(and(eq(attendances.id, id), gt(attendances.amountDue, 0)))
    .returning({ id: attendances.id });
  if (!updated) {
    await getSaved(id);
    throw new Error("Could not save the payment.");
  }
}

export async function markUnpaid(id: number) {
  await requireAdmin();
  await db
    .update(attendances)
    .set({ amountPaid: 0, paidAt: null })
    .where(eq(attendances.id, id));
}

// "total received so far", not "add this much"; entering it again corrects mistakes
export async function recordPartial(id: number, formData: FormData) {
  await requireAdmin();
  const a = await getSaved(id);
  const amount = Math.max(0, Math.round(Number(formData.get("amount")) || 0));

  if (amount <= 0) return markUnpaid(id);
  if (amount >= a.amountDue) return markPaid(id);

  await db
    .update(attendances)
    .set({ amountPaid: amount, paidAt: null })
    .where(eq(attendances.id, id));
}
