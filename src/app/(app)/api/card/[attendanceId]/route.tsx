/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { loadSessionData } from "@/lib/session-data";
import { loadFonts } from "@/lib/og";
import { buildQrUrl, fetchQrDataUrl, transferNote } from "@/lib/vietqr";
import { statusOf } from "@/lib/payments";
import { fmtHour, vnd } from "@/lib/format";
import { translate, type Language } from "@/lib/i18n";

const niceDate = (d: string, language: Language) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString(
    language === "vi" ? "vi-VN" : "en-GB",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );

export async function GET(
  req: Request,
  { params }: { params: Promise<{ attendanceId: string }> },
) {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });

  const aid = Number((await params).attendanceId);
  if (!Number.isInteger(aid)) return new Response("Bad id", { status: 400 });
  const language: Language =
    new URL(req.url).searchParams.get("lang") === "vi" ? "vi" : "en";
  const t = (message: string, values?: Record<string, string | number>) =>
    translate(language, message, values);
  const money = (amount: number) => vnd(amount, language);

  const { BANK_ID, BANK_NAME, BANK_ACCOUNT_NO, BANK_ACCOUNT_NAME } =
    process.env;
  if (!BANK_ID || !BANK_ACCOUNT_NO || !BANK_ACCOUNT_NAME) {
    return new Response(
      "Set BANK_ID, BANK_ACCOUNT_NO and BANK_ACCOUNT_NAME in env",
      { status: 500 },
    );
  }

  const [row] = await db
    .select({ sessionId: attendances.sessionId })
    .from(attendances)
    .where(eq(attendances.id, aid));
  if (!row) return new Response("Not found", { status: 404 });

  const data = await loadSessionData(row.sessionId);
  const a = data?.attendees.find((x) => x.id === aid);
  const l = data?.split.lines.find((x) => x.id === aid);
  if (!data || !a || !l) return new Response("Not found", { status: 404 });

  if (a.amountDue !== l.total) {
    return new Response(
      "Amounts changed. Press “Save amounts” on the session page first.",
      { status: 409 },
    );
  }

  const status = statusOf(a.amountDue, a.amountPaid);
  const left = Math.max(0, a.amountDue - a.amountPaid);
  const note = transferNote(data.session.date, a.name, a.nickname);
  const qr =
    status === "paid"
      ? null
      : await fetchQrDataUrl(
          buildQrUrl({
            bank: BANK_ID,
            account: BANK_ACCOUNT_NO,
            accountName: BANK_ACCOUNT_NAME,
            amount: left,
            note,
          }),
        );

  const rounding = l.total - (l.court + l.shuttle + l.drinks + l.snack);
  const lines: [string, number][] = [
    [t("Court · {hours}h", { hours: l.hours }), l.court],
    [t("Shuttlecocks"), l.shuttle],
    [t("Drinks"), l.drinks],
    [t("Snack"), l.snack],
    [t("Rounding"), rounding],
  ];
  const shown = lines.filter(([, v]) => v > 0);

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 24,
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  } as const;

  const height = (status === "paid" ? 560 : 960) + shown.length * 48;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 40,
        background: "#ffffff",
        fontFamily: "BeVietnam",
        color: "#111827",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: "#1f5c99",
          }}
        >
          Badminton
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#6b7280" }}>
          {`${niceDate(data.session.date, language)}${data.session.venue ? " · " + data.session.venue : ""}`}
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
        {a.name}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          color: "#6b7280",
          marginBottom: 16,
        }}
      >
        {`${fmtHour(a.startHour)}–${fmtHour(a.endHour)} · ${l.hours}h`}
      </div>

      {shown.map(([label, value]) => (
        <div key={label} style={rowStyle}>
          <div style={{ display: "flex", flex: 1, paddingRight: 16 }}>
            {label}
          </div>
          <div style={{ display: "flex" }}>{money(value)}</div>
        </div>
      ))}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex" }}>{t("Total")}</div>
        <div style={{ display: "flex" }}>{money(a.amountDue)}</div>
      </div>

      {status === "paid" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 32,
            padding: 24,
            background: "#dcfce7",
            color: "#166534",
            fontSize: 32,
            fontWeight: 700,
            borderRadius: 16,
          }}
        >
          {t("PAID · thank you")}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 24,
          }}
        >
          {a.amountPaid > 0 && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#a16207",
                marginBottom: 8,
              }}
            >
              {t("Received {received} · remaining {left}", {
                received: money(a.amountPaid),
                left: money(left),
              })}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {t("Please transfer {amount}", { amount: money(left) })}
          </div>
          {qr ? (
            <img
              src={qr}
              width={320}
              height={320}
              style={{ objectFit: "contain" }}
              alt=""
            />
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#b91c1c",
                padding: "40px 0",
              }}
            >
              {t("QR unavailable. Please transfer manually.")}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              marginTop: 20,
              padding: 20,
              background: "#f3f4f6",
              borderRadius: 12,
              fontSize: 22,
            }}
          >
            <div
              style={{ display: "flex" }}
            >{t("Bank: {bank}", { bank: BANK_NAME ?? BANK_ID })}</div>
            <div
              style={{ display: "flex" }}
            >{t("Account: {account}", { account: BANK_ACCOUNT_NO })}</div>
            <div
              style={{ display: "flex" }}
            >{t("Name: {name}", { name: BANK_ACCOUNT_NAME })}</div>
            <div
              style={{ display: "flex", fontWeight: 700 }}
            >{t("Note: {note}", { note })}</div>
          </div>
        </div>
      )}
    </div>,
    {
      width: 720,
      height,
      fonts: await loadFonts(),
      headers: { "Cache-Control": "no-store" },
    },
  );
}
