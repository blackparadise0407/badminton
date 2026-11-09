"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances } from "@/db/schema";

async function requireAdmin() {
  if (!(await auth())) throw new Error("Unauthorized");
}
const refresh = () => {
  revalidatePath("/");
  revalidatePath("/sessions/[id]", "page");
};
const asMethod = (v: unknown): "bank" | "cash" => {
  if (v !== "bank" && v !== "cash") throw new Error("Invalid method");
  return v;
};

async function getSaved(id: number) {
  const [a] = await db.select().from(attendances).where(eq(attendances.id, id));
  if (!a) throw new Error("Not found");
  if (a.amountDue <= 0) throw new Error("Save the session amounts first");
  return a;
}

export async function markPaid(id: number, method: "bank" | "cash") {
  await requireAdmin();
  const a = await getSaved(id);
  await db
    .update(attendances)
    .set({
      amountPaid: a.amountDue,
      paidAt: new Date(),
      method: asMethod(method),
    })
    .where(eq(attendances.id, id));
  refresh();
}

export async function markUnpaid(id: number) {
  await requireAdmin();
  await db
    .update(attendances)
    .set({ amountPaid: 0, paidAt: null, method: null })
    .where(eq(attendances.id, id));
  refresh();
}

// "total received so far", not "add this much"; entering it again corrects mistakes
export async function recordPartial(id: number, formData: FormData) {
  await requireAdmin();
  const a = await getSaved(id);
  const method = asMethod(formData.get("method"));
  const amount = Math.max(0, Math.round(Number(formData.get("amount")) || 0));

  if (amount <= 0) return markUnpaid(id);
  if (amount >= a.amountDue) return markPaid(id, method);

  await db
    .update(attendances)
    .set({ amountPaid: amount, paidAt: null, method })
    .where(eq(attendances.id, id));
  refresh();
}
