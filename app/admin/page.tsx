import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { getUsersProgressSummary } from "@/db/admin";
import { getTotalItemCount } from "@/lib/curriculum";
import { fetchLastStatusAt } from "@/lib/mastodon";
import { UsersTable, type UserRow } from "@/components/users-table";

export const metadata = { title: "運営ダッシュボード | はじめてのWEB開発ゼミ" };

/** これより長くログインがないユーザーを非アクティブ扱いにする日数 */
const INACTIVE_AFTER_DAYS = 10;
/** この日数以内にトゥートがあれば「活動中」とみなす */
const TOOT_RECENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(d: Date): string {
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  await requireStaff();

  const total = getTotalItemCount();
  const summary = await getUsersProgressSummary();
  const now = Date.now();

  // 各メンバーの最終トゥートをMastodon公開APIから並列取得（認証不要）。
  // アーカイブ済み・非Mastodon・未設定は取得をスキップし、失敗時は null。
  const instance = process.env.MASTODON_INSTANCE;
  const lastToots = await Promise.all(
    summary.map((u) =>
      instance &&
      u.provider === "mastodon" &&
      u.providerUid &&
      u.archivedAt === null
        ? fetchLastStatusAt({ instance, accountId: u.providerUid })
        : Promise.resolve(null),
    ),
  );

  const rows: UserRow[] = summary.map((u, i) => {
    // 最終アクティブ＝最終ログイン（OAuth認証）日時
    const daysInactive = Math.floor((now - u.lastSeenAt.getTime()) / DAY_MS);
    const lastTootAt = lastToots[i];
    const daysSinceToot = lastTootAt
      ? Math.floor((now - lastTootAt.getTime()) / DAY_MS)
      : null;
    return {
      id: u.id,
      displayName: u.displayName,
      mastodonAcct: u.mastodonAcct,
      role: u.role,
      completed: u.completed,
      pct: total > 0 ? Math.round((u.completed / total) * 100) : 0,
      lastLoginLabel: formatDate(u.lastSeenAt),
      daysInactive,
      inactive: daysInactive > INACTIVE_AFTER_DAYS,
      archived: u.archivedAt !== null,
      attendanceCount: u.attendanceCount,
      lastTootLabel: lastTootAt ? formatDate(lastTootAt) : null,
      daysSinceToot,
      tootedRecently: daysSinceToot !== null && daysSinceToot <= TOOT_RECENT_DAYS,
    };
  });

  // 集計はアーカイブ済みを除外
  const active = rows.filter((r) => !r.archived);
  const studentCount = active.filter((r) => r.role === "student").length;
  const inactiveCount = active.filter((r) => r.inactive).length;
  const recentTootCount = active.filter((r) => r.tootedRecently).length;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">運営ダッシュボード</h1>
          <p className="text-sm text-base-content/70">
            受講生の進捗状況（全{total}項目）。{INACTIVE_AFTER_DAYS}日を超えて
            ログインがないと「非アクティブ」になります。最終トゥートはPGritの
            公開投稿から取得します（{TOOT_RECENT_DAYS}日以内は緑表示）。
          </p>
        </div>
        <Link href="/admin/meetings" className="btn btn-outline btn-sm">
          ゼミ会管理
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">受講生</div>
          <div className="text-2xl font-bold tabular-nums">{studentCount}人</div>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">登録ユーザー合計</div>
          <div className="text-2xl font-bold tabular-nums">{active.length}人</div>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">非アクティブ</div>
          <div className="text-2xl font-bold tabular-nums text-error">
            {inactiveCount}人
          </div>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">
            {TOOT_RECENT_DAYS}日以内にトゥート
          </div>
          <div className="text-2xl font-bold tabular-nums text-success">
            {recentTootCount}人
          </div>
        </div>
      </div>

      <UsersTable rows={rows} total={total} />
    </section>
  );
}
