import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import { daysSince } from "./payments";

export async function getOwing() {
  const rows = await db
    .select({
      id: attendances.id,
      sessionId: sessions.id,
      date: sessions.date,
      name: players.name,
      due: attendances.amountDue,
      paid: attendances.amountPaid,
    })
    .from(attendances)
    .innerJoin(sessions, eq(sessions.id, attendances.sessionId))
    .innerJoin(players, eq(players.id, attendances.playerId))
    .where(
      and(
        gt(attendances.amountDue, 0),
        lt(attendances.amountPaid, attendances.amountDue),
      ),
    )
    .orderBy(asc(sessions.date), asc(players.name));

  return rows.map((r) => ({
    ...r,
    left: r.due - r.paid,
    days: daysSince(r.date),
  }));
}

// Active sessions where some attendee has no saved amount yet
export async function getUnsavedSessions() {
  return db
    .selectDistinct({ id: sessions.id, date: sessions.date })
    .from(attendances)
    .innerJoin(sessions, eq(sessions.id, attendances.sessionId))
    .where(and(eq(attendances.amountDue, 0), eq(sessions.status, "active")))
    .orderBy(asc(sessions.date));
}
