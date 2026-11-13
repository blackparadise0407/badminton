"use client";

import { addPlayer, setPlayerFlag, setDefaultHours } from "./actions";
import { OptimisticToggle } from "../optimistic-toggle";
import { refreshAfter, PageDataState, useApiData } from "../api-data";
import type { PlayerRecord } from "@/lib/page-data-types";
import { useI18n } from "../../i18n-provider";

export default function PlayersPage() {
  const { t } = useI18n();
  const { data, error, loading, retry } =
    useApiData<PlayerRecord[]>("/api/app/players");
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  const all = data;

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-bold leading-tight">{t("Players")}</h1>

      <details className="panel p-4">
        <summary className="cursor-pointer font-medium text-court">
          {t("Add player")}
        </summary>
        <form
          action={refreshAfter(addPlayer)}
          className="mt-4 grid grid-cols-2 gap-3"
        >
          <label>
            <span className="label">{t("Name")}</span>
            <input name="name" required className="field" />
          </label>
          <label>
            <span className="label">{t("Nickname (optional)")}</span>
            <input name="nickname" className="field" />
          </label>
          <label>
            <span className="label">{t("Usual hours")}</span>
            <input
              name="defaultHours"
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              defaultValue={2}
              className="field"
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-3">
            <input
              name="isRegular"
              type="checkbox"
              className="size-5 accent-court"
            />{" "}
            {t("Regular")}
          </label>
          <button className="btn btn-primary col-span-2">
            {t("Add player")}
          </button>
        </form>
      </details>

      <ul className="list">
        {all.map((p) => (
          <li
            key={p.id}
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 p-4 ${p.isActive ? "" : "opacity-60"}`}
          >
            <div className="min-w-0 flex-1 basis-40">
              <div className="truncate text-[17px] font-medium">{p.name}</div>
              {p.nickname && (
                <div className="text-sm text-muted">{p.nickname}</div>
              )}
            </div>

            <form
              action={refreshAfter(setDefaultHours.bind(null, p.id))}
              className="flex items-center gap-2"
            >
              <input
                name="defaultHours"
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                defaultValue={p.defaultHours}
                aria-label={t("{name} usual hours", { name: p.name })}
                className="field min-h-9 w-16 px-2 text-center"
              />
              <span className="text-sm text-muted">h</span>
              <button className="btn btn-sm">{t("Save")}</button>
            </form>

            <OptimisticToggle
              initialValue={p.isRegular}
              action={setPlayerFlag.bind(null, p.id, "isRegular")}
              onLabel={t("Regular")}
              offLabel={t("Make regular")}
              className="btn btn-sm"
              onClassName="border-court bg-court-tint text-court"
            />

            <OptimisticToggle
              initialValue={p.isActive}
              action={setPlayerFlag.bind(null, p.id, "isActive")}
              onLabel={t("Deactivate")}
              offLabel={t("Reactivate")}
              className="btn btn-sm"
            />
          </li>
        ))}
        {all.length === 0 && (
          <li className="p-4 text-muted">
            {t("No players yet. Add the people who usually come.")}
          </li>
        )}
      </ul>
    </div>
  );
}
