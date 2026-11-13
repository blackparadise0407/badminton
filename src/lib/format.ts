export type FormatLanguage = "en" | "vi";

export const vnd = (n: number, language: FormatLanguage = "en") =>
  `${n.toLocaleString(language === "vi" ? "vi-VN" : "en-US")}đ`;
export const fmtHour = (h: number) => `${Math.floor(h)}:${h % 1 ? "30" : "00"}`;
export const fmtDate = (d: string, language: FormatLanguage = "en") => {
  const locale = language === "vi" ? "vi-VN" : "en-GB";
  return new Date(`${d}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};
