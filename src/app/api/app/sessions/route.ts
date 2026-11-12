import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendances, sessions } from "@/db/schema";
import { jsonNoStore, requireAuthenticatedRequest } from "../_auth";

export async function GET(request: Request) {
  const unauthorized = await requireAuthenticatedRequest();
  if (unauthorized) return unauthorized;

  const showArchived =
    new URL(request.url).searchParams.get("show") === "archived";
  const rows = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      venue: sessions.venue,
      count: sql<number>`count(${attendances.id})`.mapWith(Number),
      unpaid:
        sql<number>`count(*) filter (where ${attendances.amountDue} = 0 or ${attendances.amountPaid} < ${attendances.amountDue})`.mapWith(
          Number,
        ),
    })
    .from(sessions)
    .leftJoin(attendances, eq(attendances.sessionId, sessions.id))
    .where(eq(sessions.status, showArchived ? "archived" : "active"))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.date), desc(sessions.id));

  return jsonNoStore(rows);
}
