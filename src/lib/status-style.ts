import type { PayStatus } from "./payments";

export const statusLabel: Record<PayStatus, string> = {
  paid: "Paid",
  partial: "Part paid",
  unpaid: "Unpaid",
};
export const statusChip: Record<PayStatus, string> = {
  paid: "chip-paid",
  partial: "chip-partial",
  unpaid: "chip-unpaid",
};
export const statusBar: Record<PayStatus, string> = {
  paid: "bg-paid",
  partial: "bg-partial",
  unpaid: "bg-unpaid",
};
export const statusBorder: Record<PayStatus, string> = {
  paid: "border-l-paid",
  partial: "border-l-partial",
  unpaid: "border-l-unpaid",
};
