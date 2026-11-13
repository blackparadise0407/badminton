import { describe, expect, it } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  it("uses English source text for English", () => {
    expect(translate("en", "New session")).toBe("New session");
  });

  it("translates and interpolates Vietnamese messages", () => {
    expect(translate("vi", "Overdue after {days} days", { days: 3 })).toBe(
      "Quá hạn sau 3 ngày",
    );
  });

  it("translates request status errors", () => {
    expect(translate("vi", "Request failed (404)")).toBe(
      "Yêu cầu thất bại (404)",
    );
  });
});
