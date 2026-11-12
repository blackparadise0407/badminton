import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { jsonNoStore, requireAuthenticatedRequest } from "../_auth";

export async function GET() {
  const unauthorized = await requireAuthenticatedRequest();
  if (unauthorized) return unauthorized;

  const data = await db
    .select({
      id: players.id,
      name: players.name,
      nickname: players.nickname,
      isRegular: players.isRegular,
      isActive: players.isActive,
      defaultHours: players.defaultHours,
    })
    .from(players)
    .orderBy(
      desc(players.isActive),
      desc(players.isRegular),
      asc(players.name),
    );

  return jsonNoStore(data);
}
