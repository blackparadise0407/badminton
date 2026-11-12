"use client";

import { useOffline } from "next/offline";
import { useEffect, useState } from "react";

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
  const [message, setMessage] = useState("");

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

    if ("serviceWorker" in navigator) {
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
    if (!("serviceWorker" in navigator)) {
      setMessage("Service worker support is unavailable.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active;
    if (!worker) {
      setMessage("Offline storage is not ready yet.");
      return;
    }

    worker.postMessage("CLEAR_CACHED_PAGES");
    setMessage("Saved pages cleared from this device.");
  }

  return (
    <div className="space-y-2 pb-3">
      {isOffline && (
        <p
          role="status"
          className="rounded-lg bg-partial-tint px-3 py-2 text-sm text-partial"
        >
          Offline. Previously visited pages may be available. Pending requests
          will retry when you reconnect.
        </p>
      )}

      {swError && (
        <p role="status" className="text-sm text-unpaid">
          Offline support could not start: {swError}
        </p>
      )}

      {!isInstalled && installPrompt && (
        <button onClick={installApp} className="btn btn-sm">
          Install app
        </button>
      )}

      {!isInstalled && isIos && (
        <p className="text-xs text-muted">
          To install, tap Share in Safari, then Add to Home Screen.
        </p>
      )}

      <details className="text-xs text-muted">
        <summary className="cursor-pointer">Offline data on this device</summary>
        <p className="mt-1">
          Previously visited signed-in pages can be stored in this browser,
          including session and payment information. Anyone with access to this
          unlocked device may be able to view them.
        </p>
        <button
          type="button"
          className="mt-2 underline"
          onClick={clearCachedPages}
        >
          Clear saved pages
        </button>
        {message && <span role="status" className="ml-2">{message}</span>}
      </details>
    </div>
  );
}
