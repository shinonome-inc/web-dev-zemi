import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { listMeetings } from "@/db/meetings";

export const metadata = { title: "ゼミ会管理 | はじめてのWEB開発ゼミ" };

export default async function MeetingsAdminPage() {
  await requireStaff();
  const meetings = await listMeetings();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="link link-hover text-sm text-base-content/60">
            ← ダッシュボード
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">ゼミ会管理</h1>
        </div>
        <Link href="/admin/meetings/new" className="btn btn-primary btn-sm">
          新規作成
        </Link>
      </div>

      <ul className="grid gap-2">
        {meetings.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/meetings/${m.id}`}
              className="flex items-center gap-4 rounded-lg border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary"
            >
              <span className="font-mono text-sm text-base-content/60">
                {m.heldOn}
              </span>
              <span className="font-medium">{m.title}</span>
            </Link>
          </li>
        ))}
        {meetings.length === 0 && (
          <li className="text-sm text-base-content/60">
            まだゼミ会がありません。「新規作成」から追加してください。
          </li>
        )}
      </ul>
    </section>
  );
}
