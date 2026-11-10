import { eq, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import { todayVN } from "./payments";

export type Period = "month" | "all";

export async function getLeaderboard(period: Period) {
  // Vietnam calendar month: "2026-11-01"
  const from = period === "month" ? `${todayVN().slice(0, 7)}-01` : null;
  const where = from ? gte(sessions.date, from) : undefined;

  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      isActive: players.isActive,
      sessions: sql<number>`count(${attendances.id})`.mapWith(Number),
      hours:
        sql<number>`coalesce(sum(${attendances.endHour} - ${attendances.startHour}), 0)`.mapWith(
          Number,
        ),
    })
    .from(attendances)
    .innerJoin(sessions, eq(sessions.id, attendances.sessionId))
    .innerJoin(players, eq(players.id, attendances.playerId))
    .where(where)
    .groupBy(players.id);

  const [total] = await db
    .select({
      n: sql<number>`count(distinct ${attendances.sessionId})`.mapWith(Number),
    })
    .from(attendances)
    .innerJoin(sessions, eq(sessions.id, attendances.sessionId))
    .where(where);

  return { rows, totalSessions: total?.n ?? 0 };
}
