"use client";

import { useOptimistic, useTransition } from "react";
import { useToast } from "./toast-provider";

export function OptimisticToggle({
  initialValue,
  action,
  onAction,
  offAction,
  onLabel,
  offLabel,
  className,
  onClassName = "",
  offClassName = "",
}: {
  initialValue: boolean;
  action: () => Promise<void>;
  onAction?: () => Promise<void>;
  offAction?: () => Promise<void>;
  onLabel: string;
  offLabel: string;
  className: string;
  onClassName?: string;
  offClassName?: string;
}) {
  const [value, setValue] = useOptimistic(
    initialValue,
    (_current, next: boolean) => next,
  );
  const [pending, startTransition] = useTransition();
  const notify = useToast();

  function toggle() {
    startTransition(async () => {
      const next = !value;
      setValue(next);
      try {
        await (next ? (onAction ?? action) : (offAction ?? action))();
      } catch {
        notify("Could not save this change. Please try again.", "error");
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        aria-pressed={value}
        disabled={pending}
        onClick={toggle}
        className={`${className} ${value ? onClassName : offClassName}`}
      >
        {value ? onLabel : offLabel}
      </button>
    </span>
  );
}
