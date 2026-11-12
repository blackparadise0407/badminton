"use client";

import { useOptimistic, useTransition } from "react";
import {
  markPaid,
  markUnpaid,
  recordPartial,
} from "@/app/(app)/payment-actions";
import { statusOf } from "@/lib/payments";
import { statusChip, statusLabel } from "@/lib/status-style";
import { vnd } from "@/lib/format";
import { useToast } from "../../toast-provider";

export function StatusBadge({ due, paid }: { due: number; paid: number }) {
  const s = statusOf(due, paid);
  return <span className={`chip ${statusChip[s]}`}>{statusLabel[s]}</span>;
}

export function PaymentControls({
  id,
  due,
  paid,
  paidAt,
}: {
  id: number;
  due: number;
  paid: number;
  paidAt: Date | null;
}) {
  const card = (
    <a href={`/api/card/${id}`} target="_blank" className="btn">
      Payment card
    </a>
  );
  const [payment, setPayment] = useOptimistic(
    { paid, paidAt },
    (_current, next: { paid: number; paidAt: Date | null }) => next,
  );
  const [pending, startTransition] = useTransition();
  const notify = useToast();
  const currentStatus = statusOf(due, payment.paid);
  const markAsPaid = () =>
    updatePayment({ paid: due, paidAt: new Date() }, () => markPaid(id));
  const markAsUnpaid = () =>
    updatePayment({ paid: 0, paidAt: null }, () => markUnpaid(id));

  function updatePayment(
    next: { paid: number; paidAt: Date | null },
    action: () => Promise<void>,
  ) {
    startTransition(async () => {
      setPayment(next);
      try {
        await action();
      } catch {
        notify("Could not save payment. Please try again.", "error");
      }
    });
  }

  if (due <= 0) return null;

  if (currentStatus === "paid") {
    const when = payment.paidAt
      ? ` on ${payment.paidAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Ho_Chi_Minh" })}`
      : "";
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <span className="chip chip-paid">Paid</span>
            <div className="text-sm text-muted">{`Paid ${vnd(payment.paid)} ${when}`}</div>
          </div>
          <div className="flex gap-2">
            <a href={`/api/card/${id}`} target="_blank" className="btn btn-sm">
              Payment card
            </a>
            <button
              type="button"
              className="btn btn-sm"
              disabled={pending}
              onClick={markAsUnpaid}
            >
              Undo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className={`chip ${statusChip[currentStatus]}`}>
        {statusLabel[currentStatus]}
      </span>
      {currentStatus === "partial" && (
        <p className="text-sm text-partial">{`Received ${vnd(payment.paid)}, ${vnd(due - payment.paid)} left`}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-paid"
          disabled={pending}
          onClick={markAsPaid}
        >
          {pending ? "Saving..." : "Paid"}
        </button>
        {card}
        {currentStatus === "partial" && (
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={markAsUnpaid}
          >
            Undo
          </button>
        )}
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-court">
          Part payment
        </summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const amount = Math.max(
              0,
              Math.round(Number(formData.get("amount")) || 0),
            );
            updatePayment(
              {
                paid: Math.min(amount, due),
                paidAt: null,
              },
              () => recordPartial(id, formData),
            );
          }}
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
              defaultValue={payment.paid || ""}
              className="field"
            />
          </label>
          <button className="btn" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </button>
        </form>
      </details>
    </div>
  );
}
