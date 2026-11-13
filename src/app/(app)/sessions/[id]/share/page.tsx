"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ShareImageActions } from "./share-image-actions";
import { useI18n } from "../../../../i18n-provider";

export default function ShareSessionImage() {
  const { language, t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const options = useSearchParams();
  if (!Number.isInteger(Number(id))) {
    return (
      <p role="alert" className="text-unpaid">
        {t("Invalid session id.")}
      </p>
    );
  }
  const query = new URLSearchParams();
  if (options.get("hideStatus") === "on") query.set("hideStatus", "on");
  if (options.get("hideDetail") === "on") query.set("hideDetail", "on");
  query.set("lang", language);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const imageUrl = `/api/export/session/${id}${suffix}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href={`/sessions/${id}`}
            className="text-sm font-medium text-court"
          >
            {t("Back to session")}
          </Link>
          <h1 className="mt-1 text-[22px] font-bold leading-tight">
            {t("Session summary")}
          </h1>
        </div>
        <ShareImageActions
          imageUrl={imageUrl}
          fileName={`badminton-session-${id}.png`}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={t("Badminton session payment summary")}
          className="h-auto w-full rounded-xl"
        />
      </div>
    </div>
  );
}
