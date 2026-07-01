import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth-guard";
import { getUserById } from "@/db/admin";
import { getAllCompletedItemIds } from "@/db/progress";
import { getCurriculumManifest, getTotalItemCount } from "@/lib/curriculum";
import { isUuid } from "@/lib/validation";

export default async function UserProgressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const user = await getUserById(id);
  if (!user) notFound();

  const completed = new Set(await getAllCompletedItemIds(id));
  const manifest = getCurriculumManifest();
  const total = getTotalItemCount();
  const doneTotal = manifest
    .flatMap((w) => w.items)
    .filter((item) => completed.has(item.id)).length;
  const pct = total > 0 ? Math.round((doneTotal / total) * 100) : 0;

  return (
    <section className="space-y-8">
      <div className="text-sm">
        <Link href="/admin" className="link link-hover text-base-content/60">
          ← ダッシュボード
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{user.displayName}</h1>
        {user.mastodonAcct && (
          <p className="text-sm text-base-content/50">{user.mastodonAcct}</p>
        )}
        <div className="flex items-center gap-3">
          <progress
            className="progress progress-primary w-48"
            value={pct}
            max={100}
          />
          <span className="text-sm tabular-nums">
            {pct}%（{doneTotal}/{total}）
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {manifest.map((week) => {
          const weekDone = week.items.filter((i) => completed.has(i.id)).length;
          return (
            <div
              key={week.slug}
              className="rounded-lg border border-base-300 bg-base-100 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold">
                  <span className="badge badge-outline badge-sm mr-2">
                    {week.label}
                  </span>
                  {week.title}
                </h2>
                <span className="text-sm text-base-content/60">
                  {weekDone}/{week.items.length}
                </span>
              </div>
              <ul className="space-y-1">
                {week.items.map((item) => {
                  const done = completed.has(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-2 text-sm">
                      <span className={done ? "text-success" : "text-base-content/30"}>
                        {done ? "✓" : "○"}
                      </span>
                      <span className={done ? "" : "text-base-content/60"}>
                        {item.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
