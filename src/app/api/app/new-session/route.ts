import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import { jsonNoStore, requireAuthenticatedRequest } from "../_auth";

export async function GET() {
  const unauthorized = await requireAuthenticatedRequest();
  if (unauthorized) return unauthorized;

  const [last] = await db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.id))
    .limit(1);

  const list = await db
    .select({
      id: players.id,
      name: players.name,
      nickname: players.nickname,
      isRegular: players.isRegular,
    })
    .from(players)
    .where(eq(players.isActive, true))
    .orderBy(desc(players.isRegular), asc(players.name));

  let startHour = 19;
  let endHour = 21;
  if (last) {
    const [hours] = await db
      .select({
        start: sql<number | null>`min(${attendances.startHour})`,
        end: sql<number | null>`max(${attendances.endHour})`,
      })
      .from(attendances)
      .where(eq(attendances.sessionId, last.id));
    if (
      hours?.start != null &&
      hours?.end != null &&
      Number(hours.end) > Number(hours.start)
    ) {
      startHour = Number(hours.start);
      endHour = Number(hours.end);
    }
  }

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return jsonNoStore({
    players: list,
    defaults: {
      date: today,
      venue: last?.venue ?? "",
      courts: last?.courts ?? 1,
      courtRatePerHour: last?.courtRatePerHour ?? "",
      shuttlePrice: last?.shuttlePrice ?? "",
      startHour,
      endHour,
    },
  });
}
