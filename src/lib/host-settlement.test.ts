import { describe, expect, it } from "vitest";
import { summarizeHostSettlement } from "./host-settlement";
import type { SplitSession } from "./split";

const session: SplitSession = {
  courts: 1,
  courtRatePerHour: 100000,
  shuttlePrice: 0,
  shuttlesUsed: 0,
  drinksTotal: 0,
  snackTotal: 0,
};

const attendee = (overrides = {}) => ({
  id: 1,
  startHour: 19,
  endHour: 21,
  joinedDrinks: true,
  joinedSnack: false,
  amountDue: 200000,
  amountPaid: 150000,
  ...overrides,
});

describe("summarizeHostSettlement", () => {
  it("reports unpaid amounts and the host's remaining advance", () => {
    expect(
      summarizeHostSettlement({
        id: 1,
        date: "2026-11-13",
        session,
        attendees: [attendee()],
      }),
    ).toEqual({
      id: 1,
      date: "2026-11-13",
      spent: 200000,
      collected: 150000,
      unpaid: 50000,
      balance: 50000,
      needsSave: false,
    });
  });

  it("keeps overpayments from hiding other attendees' unpaid dues", () => {
    const result = summarizeHostSettlement({
      id: 2,
      date: "2026-11-14",
      session,
      attendees: [
        attendee({ id: 1, amountDue: 100000, amountPaid: 150000 }),
        attendee({ id: 2, amountDue: 100000, amountPaid: 0 }),
      ],
    });

    expect(result.unpaid).toBe(100000);
    expect(result.balance).toBe(50000);
    expect(result.needsSave).toBe(false);
  });
});
