import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { addPlayer, toggleFlag, setDefaultHours } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const all = await db
    .select()
    .from(players)
    .orderBy(
      desc(players.isActive),
      desc(players.isRegular),
      asc(players.name),
    );

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-bold leading-tight">Players</h1>

      <details className="panel p-4">
        <summary className="cursor-pointer font-medium text-court">
          Add player
        </summary>
        <form action={addPlayer} className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <span className="label">Name</span>
            <input name="name" required className="field" />
          </label>
          <label>
            <span className="label">Nickname (optional)</span>
            <input name="nickname" className="field" />
          </label>
          <label>
            <span className="label">Usual hours</span>
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
            Regular
          </label>
          <button className="btn btn-primary col-span-2">Add player</button>
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
              action={setDefaultHours.bind(null, p.id)}
              className="flex items-center gap-2"
            >
              <input
                name="defaultHours"
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                defaultValue={p.defaultHours}
                aria-label={`${p.name} usual hours`}
                className="field min-h-9 w-16 px-2 text-center"
              />
              <span className="text-sm text-muted">h</span>
              <button className="btn btn-sm">Save</button>
            </form>

            <form action={toggleFlag.bind(null, p.id, "isRegular")}>
              <button
                aria-pressed={p.isRegular}
                className={`btn btn-sm ${p.isRegular ? "border-court bg-court-tint text-court" : ""}`}
              >
                {p.isRegular ? "Regular" : "Make regular"}
              </button>
            </form>

            <form action={toggleFlag.bind(null, p.id, "isActive")}>
              <button className="btn btn-sm">
                {p.isActive ? "Deactivate" : "Reactivate"}
              </button>
            </form>
          </li>
        ))}
        {all.length === 0 && (
          <li className="p-4 text-muted">
            No players yet. Add the people who usually come.
          </li>
        )}
      </ul>
    </div>
  );
}
