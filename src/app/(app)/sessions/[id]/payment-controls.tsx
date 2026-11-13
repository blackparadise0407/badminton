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
import { refreshAfter } from "../../api-data";
import { useI18n } from "../../../i18n-provider";

export function StatusBadge({ due, paid }: { due: number; paid: number }) {
  const { t } = useI18n();
  const s = statusOf(due, paid);
  return <span className={`chip ${statusChip[s]}`}>{t(statusLabel[s])}</span>;
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
  paidAt: string | null;
}) {
  const { language, t } = useI18n();
  const money = (amount: number) => vnd(amount, language);
  const card = (
    <a href={`/api/card/${id}?lang=${language}`} target="_blank" className="btn">
      {t("Payment card")}
    </a>
  );
  const [payment, setPayment] = useOptimistic(
    { paid, paidAt },
    (_current, next: { paid: number; paidAt: string | null }) => next,
  );
  const [pending, startTransition] = useTransition();
  const notify = useToast();
  const currentStatus = statusOf(due, payment.paid);
  const markAsPaid = () =>
    updatePayment(
      { paid: due, paidAt: new Date().toISOString() },
      () => markPaid(id),
    );
  const markAsUnpaid = () =>
    updatePayment({ paid: 0, paidAt: null }, () => markUnpaid(id));

  function updatePayment(
    next: { paid: number; paidAt: string | null },
    action: () => Promise<void>,
  ) {
    startTransition(async () => {
      setPayment(next);
      try {
        await refreshAfter(action)();
      } catch {
        notify("Could not save payment. Please try again.", "error");
      }
    });
  }

  if (due <= 0) return null;

  if (currentStatus === "paid") {
    const when = payment.paidAt
      ? t("on {date}", {
          date: new Date(payment.paidAt).toLocaleDateString(
            language === "vi" ? "vi-VN" : "en-GB",
            {
              day: "numeric",
              month: "short",
              timeZone: "Asia/Ho_Chi_Minh",
            },
          ),
        })
      : "";
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <span className="chip chip-paid">{t("Paid")}</span>
            <div className="text-sm text-muted">
              {t("Paid {amount}{when}", {
                amount: money(payment.paid),
                when: when ? ` ${when}` : "",
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/card/${id}?lang=${language}`}
              target="_blank"
              className="btn btn-sm"
            >
              {t("Payment card")}
            </a>
            <button
              type="button"
              className="btn btn-sm"
              disabled={pending}
              onClick={markAsUnpaid}
            >
              {t("Undo")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className={`chip ${statusChip[currentStatus]}`}>
        {t(statusLabel[currentStatus])}
      </span>
      {currentStatus === "partial" && (
        <p className="text-sm text-partial">
          {t("Received {received}, {left} left", {
            received: money(payment.paid),
            left: money(due - payment.paid),
          })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-paid"
          disabled={pending}
          onClick={markAsPaid}
        >
          {t(pending ? "Saving..." : "Paid")}
        </button>
        {card}
        {currentStatus === "partial" && (
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={markAsUnpaid}
          >
            {t("Undo")}
          </button>
        )}
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-court">
          {t("Part payment")}
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
            <span className="label">{t("Received so far")}</span>
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
            {t(pending ? "Saving..." : "Save")}
          </button>
        </form>
      </details>
    </div>
  );
}
