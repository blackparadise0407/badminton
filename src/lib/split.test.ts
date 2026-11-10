import { describe, expect, it } from "vitest";
import { calculateSplit, type SplitSession } from "./split";

const base: SplitSession = {
  courts: 1,
  courtRatePerHour: 100000,
  shuttlePrice: 0,
  shuttlesUsed: 0,
  drinksTotal: 0,
  snackTotal: 0,
};
const p = (id: number, startHour: number, endHour: number, extra = {}) => ({
  id,
  startHour,
  endHour,
  joinedDrinks: true,
  joinedSnack: false,
  ...extra,
});

describe("calculateSplit", () => {
  it("splits court equally when everyone plays the same hours", () => {
    const r = calculateSplit(base, [p(1, 19, 21), p(2, 19, 21)]);
    expect(r.lines.map((l) => l.total)).toEqual([100000, 100000]);
    expect(r.totalSpent).toBe(200000);
    expect(r.surplus).toBe(0);
  });

  it("charges each hour only to people present in it", () => {
    const r = calculateSplit(base, [p(1, 19, 21), p(2, 20, 21)]);
    expect(r.lines.map((l) => l.court)).toEqual([150000, 50000]);
  });

  it("splits shuttles by hours played", () => {
    const r = calculateSplit(
      { ...base, courtRatePerHour: 0, shuttlePrice: 30000, shuttlesUsed: 3 },
      [p(1, 19, 22), p(2, 21, 22)],
    );
    expect(r.lines.map((l) => l.total)).toEqual([68000, 23000]);
  });

  it("splits the water bucket among those who drink from it", () => {
    const r = calculateSplit(
      { ...base, courtRatePerHour: 0, drinksTotal: 90000 },
      [p(1, 19, 20), p(2, 19, 20), p(3, 19, 20, { joinedDrinks: false })],
    );
    expect(r.lines.map((l) => l.total)).toEqual([45000, 45000, 0]);
    expect(r.totalSpent).toBe(90000);
  });

  it("spreads the drinks bill over everyone if nobody is ticked", () => {
    const r = calculateSplit(
      { ...base, courtRatePerHour: 0, drinksTotal: 30000 },
      [
        p(1, 19, 20, { joinedDrinks: false }),
        p(2, 19, 20, { joinedDrinks: false }),
        p(3, 19, 20, { joinedDrinks: false }),
      ],
    );
    expect(r.lines.map((l) => l.total)).toEqual([10000, 10000, 10000]);
  });

  it("splits snack only among joiners", () => {
    const r = calculateSplit(
      { ...base, courtRatePerHour: 0, snackTotal: 60000 },
      [
        p(1, 19, 20, { joinedSnack: true }),
        p(2, 19, 20, { joinedSnack: true }),
        p(3, 19, 20),
      ],
    );
    expect(r.lines.map((l) => l.total)).toEqual([30000, 30000, 0]);
  });

  it("rounds up so the total collected is never below the total spent", () => {
    const r = calculateSplit(base, [p(1, 19, 20), p(2, 19, 20), p(3, 19, 20)]);
    expect(r.lines.map((l) => l.total)).toEqual([34000, 34000, 34000]);
    expect(r.totalSpent).toBe(100000);
    expect(r.surplus).toBe(2000);
  });

  it("spreads court cost of empty slots over everyone", () => {
    const r = calculateSplit(base, [p(1, 19, 20), p(2, 21, 22)]);
    expect(r.lines.map((l) => l.court)).toEqual([150000, 150000]);
    expect(r.totalSpent).toBe(300000);
  });

  it("spreads the snack over everyone if nobody is ticked", () => {
    const r = calculateSplit(
      { ...base, courtRatePerHour: 0, snackTotal: 30000 },
      [p(1, 19, 20), p(2, 19, 20), p(3, 19, 20)],
    );
    expect(r.lines.map((l) => l.total)).toEqual([10000, 10000, 10000]);
  });
});
