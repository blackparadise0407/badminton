import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import { calculateSplit } from "./split";

export async function loadSessionData(sid: number) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sid));
  if (!session) return null;

  const attendees = await db
    .select({
      id: attendances.id,
      playerId: attendances.playerId,
      name: players.name,
      nickname: players.nickname,
      startHour: attendances.startHour,
      endHour: attendances.endHour,
      joinedDrinks: attendances.joinedDrinks,
      joinedSnack: attendances.joinedSnack,
      amountDue: attendances.amountDue,
      amountPaid: attendances.amountPaid,
      paidAt: attendances.paidAt,
    })
    .from(attendances)
    .innerJoin(players, eq(players.id, attendances.playerId))
    .where(eq(attendances.sessionId, sid))
    .orderBy(asc(players.name));

  const split = calculateSplit(
    session,
    attendees.map((a) => ({
      id: a.id,
      startHour: a.startHour,
      endHour: a.endHour,
      joinedDrinks: a.joinedDrinks,
      joinedSnack: a.joinedSnack,
    })),
  );

  return { session, attendees, split };
}
