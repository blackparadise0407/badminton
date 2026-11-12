import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { loadSessionData } from "@/lib/session-data";
import { jsonNoStore, requireAuthenticatedRequest } from "../../_auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAuthenticatedRequest();
  if (unauthorized) return unauthorized;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return jsonNoStore({ error: "Invalid session id" }, { status: 400 });
  }

  const [data, activePlayers] = await Promise.all([
    loadSessionData(id),
    db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.isActive, true))
      .orderBy(asc(players.name)),
  ]);
  if (!data) {
    return jsonNoStore({ error: "Session not found" }, { status: 404 });
  }

  return jsonNoStore({
    ...data,
    attendees: data.attendees.map((attendee) => ({
      ...attendee,
      paidAt: attendee.paidAt?.toISOString() ?? null,
    })),
    activePlayers,
  });
}
