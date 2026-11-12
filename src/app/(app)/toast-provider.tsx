"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastVariant = "error" | "info" | "success";
type Toast = { id: number; message: string; variant: ToastVariant };
type Notify = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<Notify | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const notify = useCallback<Notify>(
    (message, variant = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: nextId.current++, message, variant });
      timer.current = setTimeout(dismiss, 4000);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className={`app-toast app-toast-${toast.variant}`}
          role={toast.variant === "error" ? "alert" : "status"}
          aria-live={toast.variant === "error" ? "assertive" : "polite"}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="app-toast-dismiss"
            aria-label="Dismiss notification"
            onClick={dismiss}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside ToastProvider");
  return notify;
}
