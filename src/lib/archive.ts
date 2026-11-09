import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendances, sessions } from "@/db/schema";

export const ARCHIVE_AFTER_DAYS = 7;

// Archives active sessions older than N days where every attendee has fully paid
export async function autoArchive() {
  // Vietnam date, N days ago
  const cutoff = new Date(
    Date.now() + 7 * 3_600_000 - ARCHIVE_AFTER_DAYS * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);

  const candidates = await db
    .select({
      id: sessions.id,
      open: sql<number>`count(*) filter (where ${attendances.amountDue} = 0 or ${attendances.amountPaid} < ${attendances.amountDue})`.mapWith(
        Number,
      ),
    })
    .from(sessions)
    .innerJoin(attendances, eq(attendances.sessionId, sessions.id))
    .where(and(eq(sessions.status, "active"), lte(sessions.date, cutoff)))
    .groupBy(sessions.id);

  const ids = candidates.filter((c) => c.open === 0).map((c) => c.id);
  if (ids.length > 0) {
    await db
      .update(sessions)
      .set({ status: "archived" })
      .where(inArray(sessions.id, ids));
  }
  return ids.length;
}
