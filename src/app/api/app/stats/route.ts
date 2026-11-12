import { getLeaderboard, type Period } from "@/lib/stats";
import { todayVN } from "@/lib/payments";
import { jsonNoStore, requireAuthenticatedRequest } from "../_auth";

export async function GET(request: Request) {
  const unauthorized = await requireAuthenticatedRequest();
  if (unauthorized) return unauthorized;

  const period: Period =
    new URL(request.url).searchParams.get("period") === "all" ? "all" : "month";
  const data = await getLeaderboard(period);
  return jsonNoStore({ ...data, today: todayVN() });
}
