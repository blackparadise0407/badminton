export const vnd = (n: number) => `${n.toLocaleString("en-US")}đ`;
export const fmtHour = (h: number) => `${Math.floor(h)}:${h % 1 ? "30" : "00"}`;
export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
