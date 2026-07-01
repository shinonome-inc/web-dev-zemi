import Link from "next/link";
import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { requireUser } from "@/lib/auth-guard";
import { getAllCompletedItemIds, getWeeklyCheckCount } from "@/db/progress";
import { getAttendanceCount } from "@/db/meetings";
import { getCurriculumManifest, getTotalItemCount } from "@/lib/curriculum";
import { PgritComposer } from "@/components/pgrit-composer";

const DAY_MS = 24 * 60 * 60 * 1000;

/** JSTの「今週の月曜0:00」をUTCのDateで返す。 */
function startOfWeekJST(now: Date): Date {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const daysSinceMonday = (jst.getUTCDay() + 6) % 7;
  const monday = Date.UTC(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate() - daysSinceMonday,
  );
  return new Date(monday - 9 * 60 * 60 * 1000);
}

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          はじめてのWEB開発ゼミ ポータル
        </h1>
        <p className="max-w-2xl text-base-content/70">
          AI駆動開発で学ぶ10週間カリキュラムの学習ポータルです。
          ログインすると、進捗ダッシュボードが表示されます。
        </p>
        <Link href="/login" className="btn btn-primary">
          ログイン
        </Link>
      </section>
    );
  }

  // 除名（アーカイブ）済みユーザーにはダッシュボードを表示しない
  await requireUser();

  const userId = session.user.id;
  const total = getTotalItemCount();
  const manifest = getCurriculumManifest();

  const [completedIds, weeklyCount, attendance] = await Promise.all([
    getAllCompletedItemIds(userId),
    getWeeklyCheckCount(userId, startOfWeekJST(new Date())),
    getAttendanceCount(userId),
  ]);

  const completed = new Set(completedIds);
  const done = manifest
    .flatMap((w) => w.items)
    .filter((item) => completed.has(item.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const resume = manifest.find((w) =>
    w.items.some((item) => !completed.has(item.id)),
  );

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          こんにちは、{session.user.name} さん 👋
        </h1>
        <p className="text-base-content/70">今週も少しずつ進めましょう。</p>
      </div>

      {/* 指標 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body items-center gap-2">
            <div
              className="radial-progress text-primary"
              style={{ "--value": pct } as CSSProperties}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {pct}%
            </div>
            <div className="text-sm text-base-content/70">
              進捗率（{done}/{total}）
            </div>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="text-3xl font-bold tabular-nums">{weeklyCount}</div>
            <div className="text-sm text-base-content/70">
              今週のチェック（月〜日）
            </div>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="text-3xl font-bold tabular-nums">
              {attendance}
              <span className="text-base font-normal"> 回</span>
            </div>
            <div className="text-sm text-base-content/70">ゼミ会 参加</div>
          </div>
        </div>
      </div>

      {/* 続きから & PGrit */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <h2 className="card-title text-base">続きから</h2>
            {resume ? (
              <>
                <p className="text-sm">
                  <span className="badge badge-outline badge-sm mr-2">
                    {resume.label}
                  </span>
                  {resume.title}
                </p>
                <Link
                  href={`/curriculum/${resume.slug}`}
                  className="btn btn-primary btn-sm w-fit"
                >
                  再開する
                </Link>
              </>
            ) : (
              <p className="text-sm">全課題クリア！お見事です 🎉</p>
            )}
          </div>
        </div>

        <PgritComposer canPost={session.user.provider === "mastodon"} />
      </div>

      {/* リンク */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/curriculum"
          className="card border border-base-300 bg-base-100 transition-colors hover:border-primary"
        >
          <div className="card-body">
            <h2 className="card-title text-base">カリキュラム</h2>
            <p className="text-sm text-base-content/70">
              週ごとの学習コンテンツ一覧
            </p>
          </div>
        </Link>
        <Link
          href="/meetings"
          className="card border border-base-300 bg-base-100 transition-colors hover:border-primary"
        >
          <div className="card-body">
            <h2 className="card-title text-base">ゼミ会アーカイブ</h2>
            <p className="text-sm text-base-content/70">過去のゼミ会の記録</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
