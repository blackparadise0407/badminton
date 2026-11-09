import { timingSafeEqual } from "node:crypto";
import { autoArchive } from "@/lib/archive";
import { getOwing, getUnsavedSessions } from "@/lib/owing";
import { OVERDUE_DAYS, daysSince } from "@/lib/payments";
import { sendTelegram } from "@/lib/telegram";
import { vnd } from "@/lib/format";

const dm = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never run open
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  const archived = dry ? 0 : await autoArchive();

  const overdue = (await getOwing()).filter((r) => r.days >= OVERDUE_DAYS);
  const unsaved = (await getUnsavedSessions()).filter(
    (s) => daysSince(s.date) >= 1,
  );

  if (overdue.length === 0 && unsaved.length === 0) {
    return Response.json({ archived, overdue: 0, unsaved: 0, sent: false });
  }

  const parts: string[] = [];
  if (overdue.length > 0) {
    const total = overdue.reduce((t, r) => t + r.left, 0);
    parts.push(`🏸 ${overdue.length} overdue · ${vnd(total)}`, "");
    for (const r of overdue) {
      parts.push(`• ${r.name} · ${dm(r.date)} · ${vnd(r.left)} · ${r.days}d`);
    }
  }
  if (unsaved.length > 0) {
    if (parts.length) parts.push("");
    parts.push(
      `⚠️ Amounts not saved: ${unsaved.map((s) => dm(s.date)).join(", ")}`,
    );
  }
  if (process.env.APP_URL) parts.push("", process.env.APP_URL);
  const text = parts.join("\n");

  if (dry) return Response.json({ dry: true, text });

  await sendTelegram(text);
  return Response.json({
    archived,
    overdue: overdue.length,
    unsaved: unsaved.length,
    sent: true,
  });
}
