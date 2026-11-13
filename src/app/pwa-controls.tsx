"use client";

import { useOffline } from "next/offline";
import { useEffect, useState } from "react";
import { useToast } from "./(app)/toast-provider";
import { useI18n } from "./i18n-provider";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaControls() {
  const isOffline = useOffline();
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [swError, setSwError] = useState<string | null>(null);
  const notify = useToast();
  const { t } = useI18n();

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setIsInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true,
    );

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "production") {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const appRegistrations = registrations.filter((registration) =>
          registration.active
            ? new URL(registration.active.scriptURL).pathname === "/sw.js"
            : false,
        );
        const wasControlled = Boolean(navigator.serviceWorker.controller);
        const removed = await Promise.all(
          appRegistrations.map((registration) => registration.unregister()),
        );
        await Promise.all(
          ["badminton-v1-shell", "badminton-v1-pages"].map((name) =>
            caches.delete(name),
          ),
        );
        if (wasControlled && removed.some(Boolean)) window.location.reload();
      })().catch((error: unknown) => {
        const detail =
          error instanceof Error ? error.message : "Unknown service worker error";
        setSwError(detail);
      });
    } else if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error: unknown) => {
          const detail =
            error instanceof Error ? error.message : "Unknown service worker error";
          setSwError(detail);
        });
    } else {
      setSwError("This browser does not support service workers.");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  }

  async function clearCachedPages() {
    if (!("caches" in window)) {
      notify("Offline storage is unavailable.", "info");
      return;
    }

    try {
      const cleared = await caches.delete("badminton-v1-pages");
      notify(
        cleared
          ? "Saved pages cleared from this device."
          : "No saved pages to clear.",
        "success",
      );
    } catch {
      notify("Could not clear saved pages from this device.", "error");
    }
  }

  return (
    <div className="space-y-2 pb-3">
      {isOffline && (
        <p
          role="status"
          className="rounded-lg bg-partial-tint px-3 py-2 text-sm text-partial"
        >
          {t(
            "Offline. Previously visited pages may be available. Pending requests will retry when you reconnect.",
          )}
        </p>
      )}

      {swError && (
        <p role="status" className="text-sm text-unpaid">
          {t("Offline support could not start: {error}", {
            error: t(swError),
          })}
        </p>
      )}

      {!isInstalled && installPrompt && (
        <button onClick={installApp} className="btn btn-sm">
          {t("Install app")}
        </button>
      )}

      {!isInstalled && isIos && (
        <p className="text-xs text-muted">
          {t("To install, tap Share in Safari, then Add to Home Screen.")}
        </p>
      )}

      <details className="text-xs text-muted">
        <summary className="cursor-pointer">
          {t("Offline data on this device")}
        </summary>
        <p className="mt-1">
          {t(
            "Previously visited signed-in pages can be stored in this browser, including session and payment information. Anyone with access to this unlocked device may be able to view them.",
          )}
        </p>
        <button
          type="button"
          className="mt-2 underline"
          onClick={clearCachedPages}
        >
          {t("Clear saved pages")}
        </button>
      </details>
    </div>
  );
}
