import { auth } from "@/auth";

export async function requireAuthenticatedRequest() {
  if (await auth()) return null;

  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export function jsonNoStore(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...init?.headers,
      "Cache-Control": "no-store",
    },
  });
}
