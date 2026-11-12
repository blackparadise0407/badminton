import { getOwing, getUnsavedSessions } from "@/lib/owing";
import { jsonNoStore, requireAuthenticatedRequest } from "../_auth";

export async function GET() {
  const unauthorized = await requireAuthenticatedRequest();
  if (unauthorized) return unauthorized;

  const [rows, unsavedSessions] = await Promise.all([
    getOwing(),
    getUnsavedSessions(),
  ]);
  return jsonNoStore({ rows, unsavedSessions });
}
