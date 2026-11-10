export const ROUND_TO = 1000;

export type SplitSession = {
  courts: number;
  courtRatePerHour: number;
  shuttlePrice: number;
  shuttlesUsed: number;
  drinksTotal: number;
  snackTotal: number;
};

export type SplitAttendee = {
  id: number;
  startHour: number;
  endHour: number;
  joinedDrinks: boolean;
  joinedSnack: boolean;
};

export type SplitLine = {
  id: number;
  hours: number;
  court: number;
  shuttle: number;
  drinks: number;
  snack: number;
  total: number; // rounded up to ROUND_TO
};

export type SplitResult = {
  lines: SplitLine[];
  totalSpent: number;
  totalOwed: number;
  surplus: number;
};

// round to cents first to kill floating-point noise, then ceil to ROUND_TO
const roundUp = (x: number) =>
  Math.ceil(Math.round(x * 100) / 100 / ROUND_TO) * ROUND_TO;

// A shared bill split equally among those who joined.
// If the bill exists but nobody is ticked, everyone pays an equal share, so you are never short.
function sharedShares(total: number, joined: boolean[]): number[] {
  if (total <= 0) return joined.map(() => 0);
  const count = joined.filter(Boolean).length;
  if (count === 0) return joined.map(() => total / joined.length);
  return joined.map((j) => (j ? total / count : 0));
}

export function calculateSplit(
  session: SplitSession,
  attendees: SplitAttendee[],
): SplitResult {
  const n = attendees.length;
  if (n === 0) return { lines: [], totalSpent: 0, totalOwed: 0, surplus: 0 };

  // ---- court: half-hour slots ----
  const slotCost = (session.courts * session.courtRatePerHour) / 2;
  const ranges = attendees.map((a) => ({
    s: Math.round(a.startHour * 2),
    e: Math.round(a.endHour * 2),
  }));
  const minS = Math.min(...ranges.map((r) => r.s));
  const maxE = Math.max(...ranges.map((r) => r.e));

  const court: number[] = new Array(n).fill(0);
  let gapCost = 0;
  for (let slot = minS; slot < maxE; slot++) {
    const present: number[] = [];
    ranges.forEach((r, i) => {
      if (slot >= r.s && slot < r.e) present.push(i);
    });
    if (present.length === 0) {
      gapCost += slotCost;
      continue;
    }
    for (const i of present) court[i] += slotCost / present.length;
  }
  if (gapCost > 0) for (let i = 0; i < n; i++) court[i] += gapCost / n;

  // ---- shuttles: by hours played ----
  const hours = ranges.map((r) => Math.max(0, (r.e - r.s) / 2));
  const totalHours = hours.reduce((t, h) => t + h, 0);
  const shuttleTotal = session.shuttlesUsed * session.shuttlePrice;

  // ---- shared bills ----
  const drinks = sharedShares(
    session.drinksTotal,
    attendees.map((a) => a.joinedDrinks),
  );
  const snack = sharedShares(
    session.snackTotal,
    attendees.map((a) => a.joinedSnack),
  );

  const lines: SplitLine[] = attendees.map((a, i) => {
    const shuttle = totalHours > 0 ? (shuttleTotal * hours[i]) / totalHours : 0;
    const exact = court[i] + shuttle + drinks[i] + snack[i];
    return {
      id: a.id,
      hours: hours[i],
      court: Math.round(court[i]),
      shuttle: Math.round(shuttle),
      drinks: Math.round(drinks[i]),
      snack: Math.round(snack[i]),
      total: roundUp(exact),
    };
  });

  const totalSpent = Math.round(
    slotCost * (maxE - minS) +
      shuttleTotal +
      session.drinksTotal +
      session.snackTotal,
  );
  const totalOwed = lines.reduce((t, l) => t + l.total, 0);

  return { lines, totalSpent, totalOwed, surplus: totalOwed - totalSpent };
}
