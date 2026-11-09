import { ImageResponse } from "next/og";
import { auth } from "@/auth";
import { loadSessionData } from "@/lib/session-data";
import { loadFonts } from "@/lib/og";
import { statusOf, type PayStatus } from "@/lib/payments";
import { fmtHour, vnd } from "@/lib/format";

type Row = {
  name: string;
  hours: number;
  court: number;
  shuttle: number;
  drinks: number;
  snack: number;
  total: number;
  status: PayStatus;
};
type Col = {
  label: string;
  w: number;
  align?: "right" | "center";
  get: (r: Row) => string;
};

const niceDate = (d: string) => d.split("-").reverse().join("/");
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const TINT: Record<PayStatus, string> = {
  paid: "#dcfce7",
  partial: "#fef9c3",
  unpaid: "#fee2e2",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });

  const sid = Number((await params).id);
  if (!Number.isInteger(sid)) return new Response("Bad id", { status: 400 });

  const sp = new URL(req.url).searchParams;
  const showStatus = sp.get("hideStatus") !== "on";
  const showDetail = sp.get("hideDetail") !== "on";

  const data = await loadSessionData(sid);
  if (!data) return new Response("Not found", { status: 404 });
  const { session: s, attendees, split } = data;
  if (attendees.length === 0)
    return new Response("No attendees", { status: 400 });

  const line = new Map(split.lines.map((l) => [l.id, l]));
  if (attendees.some((a) => a.amountDue !== line.get(a.id)!.total)) {
    return new Response(
      "Amounts changed. Press “Save amounts” on the session page first.",
      { status: 409 },
    );
  }

  const rows: Row[] = attendees.map((a) => {
    const l = line.get(a.id)!;
    return {
      name: a.name,
      hours: l.hours,
      court: l.court,
      shuttle: l.shuttle,
      drinks: l.drinks,
      snack: l.snack,
      total: a.amountDue,
      status: statusOf(a.amountDue, a.amountPaid),
    };
  });

  const detailCols: Col[] = showDetail
    ? [
        { label: "Court", w: 110, align: "right", get: (r) => vnd(r.court) },
        {
          label: "Shuttle",
          w: 110,
          align: "right",
          get: (r) => vnd(r.shuttle),
        },
        { label: "Drinks", w: 110, align: "right", get: (r) => vnd(r.drinks) },
        { label: "Snack", w: 110, align: "right", get: (r) => vnd(r.snack) },
      ]
    : [];
  const statusCols: Col[] = showStatus
    ? [{ label: "Status", w: 120, align: "center", get: (r) => cap(r.status) }]
    : [];
  const cols: Col[] = [
    { label: "Name", w: showDetail ? 220 : 300, get: (r) => r.name },
    { label: "Hours", w: 80, align: "right", get: (r) => String(r.hours) },
    ...detailCols,
    { label: "Total", w: 140, align: "right", get: (r) => vnd(r.total) },
    ...statusCols,
  ];
  const width = cols.reduce((t, c) => t + c.w, 0) + 64;

  const collected = attendees.reduce((t, a) => t + a.amountPaid, 0);
  const outstanding = attendees.reduce(
    (t, a) => t + Math.max(0, a.amountDue - a.amountPaid),
    0,
  );
  const stats: { label: string; value: number; color?: string }[] = [
    { label: "Total spent", value: split.totalSpent },
    { label: "Total owed", value: split.totalOwed },
    ...(showStatus
      ? [
          { label: "Collected", value: collected, color: "#15803d" },
          {
            label: "Outstanding",
            value: outstanding,
            color: outstanding > 0 ? "#b91c1c" : undefined,
          },
        ]
      : []),
    {
      label: "Surplus",
      value: split.surplus,
      color: split.surplus < 0 ? "#b91c1c" : "#15803d",
    },
  ];

  const minStart = Math.min(...attendees.map((a) => a.startHour));
  const maxEnd = Math.max(...attendees.map((a) => a.endHour));
  const cell = (c: Col) => ({
    display: "flex" as const,
    width: c.w,
    padding: "0 8px",
    justifyContent:
      c.align === "right"
        ? "flex-end"
        : c.align === "center"
          ? "center"
          : "flex-start",
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 32,
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
            fontSize: 34,
            fontWeight: 700,
            color: "#1f5c99",
          }}
        >
          {`Badminton · ${niceDate(s.date)}`}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#6b7280" }}>
          {`${s.venue ? s.venue + " · " : ""}${s.courts} court(s) · ${fmtHour(minStart)}–${fmtHour(maxEnd)}`}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 44,
          background: "#111827",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 8,
        }}
      >
        {cols.map((c) => (
          <div key={c.label} style={cell(c)}>
            {c.label}
          </div>
        ))}
      </div>

      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            height: 52,
            fontSize: 22,
            background: showStatus
              ? TINT[r.status]
              : i % 2
                ? "#f9fafb"
                : "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {cols.map((c) => (
            <div key={c.label} style={cell(c)}>
              {c.get(r)}
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", marginTop: 24 }}>
        {stats.map((st) => (
          <div
            key={st.label}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: 12,
              margin: "0 4px",
              background: "#f3f4f6",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", fontSize: 18, color: "#6b7280" }}>
              {st.label}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 700,
                color: st.color ?? "#111827",
              }}
            >
              {vnd(st.value)}
            </div>
          </div>
        ))}
      </div>
    </div>,
    {
      width,
      height: 400 + rows.length * 52,
      fonts: await loadFonts(),
      headers: { "Cache-Control": "no-store" },
    },
  );
}
