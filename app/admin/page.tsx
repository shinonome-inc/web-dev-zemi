import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { getUsersProgressSummary } from "@/db/admin";
import { getTotalItemCount } from "@/lib/curriculum";

export const metadata = { title: "運営ダッシュボード | はじめてのWEB開発ゼミ" };

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  await requireStaff();

  const total = getTotalItemCount();
  const users = await getUsersProgressSummary();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">運営ダッシュボード</h1>
        <p className="text-sm text-base-content/70">
          受講生の進捗状況（全{total}項目）。行をクリックで詳細。
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table">
          <thead>
            <tr>
              <th>名前</th>
              <th>ロール</th>
              <th className="w-64">進捗</th>
              <th>最終ログイン</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const pct = total > 0 ? Math.round((u.completed / total) * 100) : 0;
              return (
                <tr key={u.id} className="hover">
                  <td>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="link link-hover font-medium"
                    >
                      {u.displayName}
                    </Link>
                    {u.mastodonAcct && (
                      <div className="text-xs text-base-content/50">
                        {u.mastodonAcct}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-ghost badge-sm">{u.role}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress
                        className="progress progress-primary w-32"
                        value={pct}
                        max={100}
                      />
                      <span className="w-20 text-sm tabular-nums">
                        {pct}%（{u.completed}/{total}）
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-base-content/70">
                    {formatDate(u.lastSeenAt)}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-base-content/60">
                  まだユーザーがいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
