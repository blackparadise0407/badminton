"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n-provider";

const DATA_CHANGED_EVENT = "badminton:data-changed";
const DATA_CACHE_TTL_MS = 30_000;
const DATA_CACHE_MAX_ENTRIES = 50;

const apiDataCache = new Map<string, { data: unknown; cachedAt: number }>();

function cacheApiData(path: string, data: unknown) {
  apiDataCache.set(path, { data, cachedAt: Date.now() });
  if (apiDataCache.size > DATA_CACHE_MAX_ENTRIES) {
    const oldestPath = apiDataCache.keys().next().value;
    if (oldestPath !== undefined) apiDataCache.delete(oldestPath);
  }
}

export function useApiData<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ path, data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    const cached = apiDataCache.get(path);
    if (cached && Date.now() - cached.cachedAt < DATA_CACHE_TTL_MS) {
      setResult({
        path,
        data: cached.data as T,
        error: null,
        loading: false,
      });
      return () => controller.abort();
    }

    setResult({ path, data: null, error: null, loading: true });

    fetch(path, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json()) as { error?: unknown };
          throw new Error(
            typeof body.error === "string"
              ? body.error
              : `Request failed (${response.status})`,
          );
        }
        return (await response.json()) as T;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        cacheApiData(path, data);
        setResult({ path, data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          path,
          data: null,
          error:
            error instanceof Error ? error.message : "Could not load this page.",
          loading: false,
        });
      });

    return () => controller.abort();
  }, [path, revision]);

  useEffect(() => {
    const reload = () => {
      apiDataCache.clear();
      setRevision((value) => value + 1);
    };
    window.addEventListener(DATA_CHANGED_EVENT, reload);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, reload);
  }, []);

  const retry = () => {
    apiDataCache.delete(path);
    setRevision((value) => value + 1);
  };

  if (result.path !== path) {
    return {
      data: null,
      error: null,
      loading: true,
      retry,
    };
  }

  return {
    ...result,
    retry,
  };
}

export function refreshAfter<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args) => {
    const result = await action(...args);
    window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
    return result;
  };
}

export function PageDataState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="space-y-5" role="status" aria-label={t("Loading page")}>
        <span className="sr-only">{t("Loading page")}</span>
        <div className="h-7 w-40 animate-pulse rounded bg-line" />
        <div className="h-24 animate-pulse rounded-xl bg-line" />
        <div className="h-40 animate-pulse rounded-xl bg-line" />
      </div>
    );
  }

  return (
    <div role="alert" className="rounded-xl border border-unpaid bg-paper p-4">
      <p className="text-sm text-unpaid">
        {t(error ?? "Could not load this page.")}
      </p>
      <button type="button" className="btn btn-sm mt-3" onClick={retry}>
        {t("Try again")}
      </button>
    </div>
  );
}
