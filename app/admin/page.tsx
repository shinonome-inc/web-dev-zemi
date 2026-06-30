import { requireStaff } from "@/lib/auth-guard";
import { getUsersProgressSummary } from "@/db/admin";
import { getTotalItemCount } from "@/lib/curriculum";
import { UsersTable, type UserRow } from "@/components/users-table";

export const metadata = { title: "運営ダッシュボード | はじめてのWEB開発ゼミ" };

/** これより長くログイン/チェックがないユーザーを非アクティブ扱いにする日数 */
const INACTIVE_AFTER_DAYS = 10;
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

  const rows: UserRow[] = summary.map((u) => {
    const lastChecked = u.lastCheckedAt ? new Date(u.lastCheckedAt) : null;
    const lastActive =
      lastChecked && lastChecked > u.lastSeenAt ? lastChecked : u.lastSeenAt;
    const daysInactive = Math.floor((now - lastActive.getTime()) / DAY_MS);
    return {
      id: u.id,
      displayName: u.displayName,
      mastodonAcct: u.mastodonAcct,
      role: u.role,
      completed: u.completed,
      pct: total > 0 ? Math.round((u.completed / total) * 100) : 0,
      lastActiveLabel: formatDate(lastActive),
      daysInactive,
      inactive: daysInactive > INACTIVE_AFTER_DAYS,
    };
  });

  const studentCount = rows.filter((r) => r.role === "student").length;
  const inactiveCount = rows.filter((r) => r.inactive).length;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">運営ダッシュボード</h1>
        <p className="text-sm text-base-content/70">
          受講生の進捗状況（全{total}項目）。{INACTIVE_AFTER_DAYS}日を超えて
          ログイン・チェックがないと「非アクティブ」になります。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">受講生</div>
          <div className="text-2xl font-bold tabular-nums">{studentCount}人</div>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">登録ユーザー合計</div>
          <div className="text-2xl font-bold tabular-nums">{rows.length}人</div>
        </div>
        <div className="rounded-lg border border-base-300 bg-base-100 px-5 py-3">
          <div className="text-xs text-base-content/60">非アクティブ</div>
          <div className="text-2xl font-bold tabular-nums text-error">
            {inactiveCount}人
          </div>
        </div>
      </div>

      <UsersTable rows={rows} total={total} />
    </section>
  );
}
