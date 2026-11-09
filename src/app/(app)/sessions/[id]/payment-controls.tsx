import {
  markPaid,
  markUnpaid,
  recordPartial,
} from "@/app/(app)/payment-actions";
import { statusOf } from "@/lib/payments";
import { statusChip, statusLabel } from "@/lib/status-style";
import { vnd } from "@/lib/format";

export function StatusBadge({ due, paid }: { due: number; paid: number }) {
  const s = statusOf(due, paid);
  return <span className={`chip ${statusChip[s]}`}>{statusLabel[s]}</span>;
}

export function PaymentControls({
  id,
  due,
  paid,
  method,
  paidAt,
}: {
  id: number;
  due: number;
  paid: number;
  method: "bank" | "cash" | null;
  paidAt: Date | null;
}) {
  if (due <= 0) return null; // the page banner explains that amounts must be saved first
  const s = statusOf(due, paid);
  const card = (
    <a href={`/api/card/${id}`} target="_blank" className="btn">
      Payment card
    </a>
  );

  if (s === "paid") {
    const when = paidAt
      ? ` on ${paidAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Ho_Chi_Minh" })}`
      : "";
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted">{`Paid ${vnd(paid)} by ${method ?? "bank"}${when}`}</span>
        <div className="flex gap-2">
          <a href={`/api/card/${id}`} target="_blank" className="btn btn-sm">
            Payment card
          </a>
          <form action={markUnpaid.bind(null, id)}>
            <button className="btn btn-sm">Undo</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {s === "partial" && (
        <p className="text-sm text-partial">{`Received ${vnd(paid)}, ${vnd(due - paid)} left`}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <form action={markPaid.bind(null, id, "bank")}>
          <button className="btn btn-paid">Paid by bank</button>
        </form>
        <form action={markPaid.bind(null, id, "cash")}>
          <button className="btn">Paid cash</button>
        </form>
        {card}
        {s === "partial" && (
          <form action={markUnpaid.bind(null, id)}>
            <button className="btn">Undo</button>
          </form>
        )}
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-court">
          Part payment
        </summary>
        <form
          action={recordPartial.bind(null, id)}
          className="mt-2 flex flex-wrap items-end gap-2"
        >
          <label className="flex-1 basis-32">
            <span className="label">Received so far</span>
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              step={1000}
              min={0}
              defaultValue={paid || ""}
              className="field"
            />
          </label>
          <select
            name="method"
            defaultValue={method ?? "bank"}
            aria-label="Method"
            className="field w-24"
          >
            <option value="bank">bank</option>
            <option value="cash">cash</option>
          </select>
          <button className="btn">Save</button>
        </form>
      </details>
    </div>
  );
}
