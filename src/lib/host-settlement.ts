import { calculateSplit, type SplitAttendee, type SplitSession } from "./split";

export type HostSettlementAttendee = SplitAttendee & {
  amountDue: number;
  amountPaid: number;
};

export type HostSettlementSession = {
  id: number;
  date: string;
  spent: number;
  collected: number;
  unpaid: number;
  balance: number;
  needsSave: boolean;
};

export function summarizeHostSettlement({
  id,
  date,
  session,
  attendees,
}: {
  id: number;
  date: string;
  session: SplitSession;
  attendees: HostSettlementAttendee[];
}): HostSettlementSession {
  const split = calculateSplit(session, attendees);
  const dueByAttendance = new Map(
    split.lines.map((line) => [line.id, line.total]),
  );
  const collected = attendees.reduce((sum, attendee) => sum + attendee.amountPaid, 0);

  return {
    id,
    date,
    spent: split.totalSpent,
    collected,
    unpaid: attendees.reduce(
      (sum, attendee) =>
        sum +
        Math.max(
          0,
          (dueByAttendance.get(attendee.id) ?? 0) - attendee.amountPaid,
        ),
      0,
    ),
    balance: split.totalSpent - collected,
    needsSave: attendees.some(
      (attendee) => dueByAttendance.get(attendee.id) !== attendee.amountDue,
    ),
  };
}
