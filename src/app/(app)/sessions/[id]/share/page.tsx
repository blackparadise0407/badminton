import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareImageActions } from "./share-image-actions";

export default async function ShareSessionImage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hideStatus?: string; hideDetail?: string }>;
}) {
  const { id } = await params;
  if (!Number.isInteger(Number(id))) notFound();

  const options = await searchParams;
  const query = new URLSearchParams();
  if (options.hideStatus === "on") query.set("hideStatus", "on");
  if (options.hideDetail === "on") query.set("hideDetail", "on");
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const imageUrl = `/api/export/session/${id}${suffix}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href={`/sessions/${id}`} className="text-sm font-medium text-court">
            Back to session
          </Link>
          <h1 className="mt-1 text-[22px] font-bold leading-tight">
            Session summary
          </h1>
        </div>
        <ShareImageActions imageUrl={imageUrl} fileName={`badminton-session-${id}.png`} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Badminton session payment summary"
          className="h-auto w-full rounded-xl"
        />
      </div>
    </div>
  );
}
