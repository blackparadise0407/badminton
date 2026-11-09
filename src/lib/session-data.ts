import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { attendances, items, players, sessions } from "@/db/schema";
import { calculateSplit } from "./split";

export async function loadSessionData(sid: number) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sid));
  if (!session) return null;

  const rows = await db
    .select({
      id: attendances.id,
      playerId: attendances.playerId,
      name: players.name,
      nickname: players.nickname,
      startHour: attendances.startHour,
      endHour: attendances.endHour,
      joinedSnack: attendances.joinedSnack,
      amountDue: attendances.amountDue,
      amountPaid: attendances.amountPaid,
      method: attendances.method,
      paidAt: attendances.paidAt,
    })
    .from(attendances)
    .innerJoin(players, eq(players.id, attendances.playerId))
    .where(eq(attendances.sessionId, sid))
    .orderBy(asc(players.name));

  const ids = rows.map((r) => r.id);
  const allItems = ids.length
    ? await db
        .select()
        .from(items)
        .where(inArray(items.attendanceId, ids))
        .orderBy(asc(items.id))
    : [];

  const attendees = rows.map((r) => ({
    ...r,
    items: allItems.filter((i) => i.attendanceId === r.id),
  }));

  const split = calculateSplit(
    session,
    attendees.map((a) => ({
      id: a.id,
      startHour: a.startHour,
      endHour: a.endHour,
      joinedSnack: a.joinedSnack,
      drinks: a.items.reduce((t, i) => t + i.qty * i.unitPrice, 0),
    })),
  );

  return { session, attendees, split };
}
