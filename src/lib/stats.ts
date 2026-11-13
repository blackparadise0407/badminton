import { asc, eq, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import {
  summarizeHostSettlement,
  type HostSettlementAttendee,
  type HostSettlementSession,
} from "./host-settlement";
import { todayVN } from "./payments";

export type Period = "month" | "all";

export async function getHostSettlement(): Promise<HostSettlementSession[]> {
  const rows = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      courts: sessions.courts,
      courtRatePerHour: sessions.courtRatePerHour,
      shuttlePrice: sessions.shuttlePrice,
      shuttlesUsed: sessions.shuttlesUsed,
      drinksTotal: sessions.drinksTotal,
      snackTotal: sessions.snackTotal,
      attendanceId: attendances.id,
      startHour: attendances.startHour,
      endHour: attendances.endHour,
      joinedDrinks: attendances.joinedDrinks,
      joinedSnack: attendances.joinedSnack,
      amountDue: attendances.amountDue,
      amountPaid: attendances.amountPaid,
    })
    .from(sessions)
    .leftJoin(attendances, eq(attendances.sessionId, sessions.id))
    .orderBy(asc(sessions.date), asc(sessions.id));

  const grouped = new Map<
    number,
    {
      date: string;
      session: {
        courts: number;
        courtRatePerHour: number;
        shuttlePrice: number;
        shuttlesUsed: number;
        drinksTotal: number;
        snackTotal: number;
      };
      attendees: HostSettlementAttendee[];
    }
  >();

  for (const row of rows) {
    let group = grouped.get(row.id);
    if (!group) {
      group = {
        date: row.date,
        session: {
          courts: row.courts,
          courtRatePerHour: row.courtRatePerHour,
          shuttlePrice: row.shuttlePrice,
          shuttlesUsed: row.shuttlesUsed,
          drinksTotal: row.drinksTotal,
          snackTotal: row.snackTotal,
        },
        attendees: [],
      };
      grouped.set(row.id, group);
    }

    if (row.attendanceId !== null) {
      if (
        row.startHour === null ||
        row.endHour === null ||
        row.joinedDrinks === null ||
        row.joinedSnack === null ||
        row.amountDue === null ||
        row.amountPaid === null
      ) {
        throw new Error(`Attendance ${row.attendanceId} is incomplete.`);
      }
      group.attendees.push({
        id: row.attendanceId,
        startHour: row.startHour,
        endHour: row.endHour,
        joinedDrinks: row.joinedDrinks,
        joinedSnack: row.joinedSnack,
        amountDue: row.amountDue,
        amountPaid: row.amountPaid,
      });
    }
  }

  return Array.from(grouped, ([id, group]) => ({
    ...summarizeHostSettlement({
      id,
      date: group.date,
      session: group.session,
      attendees: group.attendees,
    }),
  }));
}

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
