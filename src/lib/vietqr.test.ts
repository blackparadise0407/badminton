import { describe, expect, it } from "vitest";
import { buildQrUrl, transferNote } from "./vietqr";

describe("transferNote", () => {
  it("uses the nickname when there is one", () => {
    expect(transferNote("2026-11-09", "Nguyễn Văn Minh", "Minh")).toBe(
      "BD 0911 Minh",
    );
  });
  it("strips Vietnamese diacritics", () => {
    expect(transferNote("2026-11-09", "Nguyễn Minh Đức", null)).toBe(
      "BD 0911 Nguyen Minh Duc",
    );
  });
});

describe("buildQrUrl", () => {
  it("encodes amount and note", () => {
    const u = buildQrUrl({
      bank: "970436",
      account: "123",
      accountName: "A B",
      amount: 77000,
      note: "BD 0911 Minh",
    });
    expect(u).toContain("970436-123-qr_only.png");
    expect(u).toContain("amount=77000");
    expect(u).toContain("addInfo=BD%200911%20Minh");
  });
});
