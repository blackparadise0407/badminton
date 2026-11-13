"use client";

import { useEffect, useState, useTransition } from "react";
import { useToast } from "./toast-provider";
import { refreshAfter } from "./api-data";

export function OptimisticToggle({
  initialValue,
  action,
  onOptimisticChange,
  refreshPaths,
  onLabel,
  offLabel,
  className,
  onClassName = "",
  offClassName = "",
}: {
  initialValue: boolean;
  action: (next: boolean) => Promise<void>;
  onOptimisticChange?: (next: boolean) => void;
  refreshPaths?: string[];
  onLabel: string;
  offLabel: string;
  className: string;
  onClassName?: string;
  offClassName?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const notify = useToast();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function toggle() {
    const previous = value;
    const next = !previous;
    setValue(next);
    onOptimisticChange?.(next);
    startTransition(async () => {
      try {
        await refreshAfter(action, refreshPaths)(next);
      } catch {
        setValue(previous);
        onOptimisticChange?.(previous);
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
