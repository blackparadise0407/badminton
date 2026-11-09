export const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

// "BD 0911 Minh": ASCII only, short, one note per person per session
export function transferNote(
  date: string,
  name: string,
  nickname: string | null,
) {
  const [, mm, dd] = date.split("-");
  const who = ascii(nickname || name)
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
  return `BD ${dd}${mm} ${who}`.trim();
}

export function buildQrUrl(o: {
  bank: string;
  account: string;
  accountName: string;
  amount: number;
  note: string;
}) {
  const q = encodeURIComponent;
  return (
    `https://img.vietqr.io/image/${q(o.bank)}-${q(o.account)}-qr_only.png` +
    `?amount=${o.amount}&addInfo=${q(o.note)}&accountName=${q(o.accountName)}`
  );
}

// Returns a data URL, or null if the QR service is down (the card then shows manual details)
export async function fetchQrDataUrl(url: string) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
