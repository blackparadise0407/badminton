export const OVERDUE_DAYS = 3;

export type PayStatus = "unpaid" | "partial" | "paid";

// due = 0 means amounts haven't been saved yet, so it can't count as paid
export const statusOf = (due: number, paid: number): PayStatus =>
  due > 0 && paid >= due ? "paid" : paid > 0 ? "partial" : "unpaid";

export const todayVN = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

// whole days between a 'YYYY-MM-DD' session date and today (Vietnam time)
export function daysSince(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [ty, tm, td] = todayVN().split("-").map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000,
  );
}
