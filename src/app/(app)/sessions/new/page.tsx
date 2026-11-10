import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendances, players, sessions } from "@/db/schema";
import { NewSessionForm } from "./new-session-form";

export const dynamic = "force-dynamic";

export default async function NewSession() {
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

  // hours of the last session: earliest start to latest end
  let startHour = 19;
  let endHour = 21;
  if (last) {
    const [h] = await db
      .select({
        start: sql<number | null>`min(${attendances.startHour})`,
        end: sql<number | null>`max(${attendances.endHour})`,
      })
      .from(attendances)
      .where(eq(attendances.sessionId, last.id));
    if (h?.start != null && h?.end != null && Number(h.end) > Number(h.start)) {
      startHour = Number(h.start);
      endHour = Number(h.end);
    }
  }

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return (
    <NewSessionForm
      players={list}
      defaults={{
        date: today,
        venue: last?.venue ?? "",
        courts: last?.courts ?? 1,
        courtRatePerHour: last?.courtRatePerHour ?? "",
        shuttlePrice: last?.shuttlePrice ?? "",
        startHour,
        endHour,
      }}
    />
  );
}
