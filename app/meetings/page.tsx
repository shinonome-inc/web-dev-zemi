import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { listMeetings } from "@/db/meetings";

export const metadata = { title: "ゼミ会アーカイブ | はじめてのWEB開発ゼミ" };

export default async function MeetingsArchivePage() {
  await requireUser();
  const meetings = await listMeetings();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">ゼミ会アーカイブ</h1>
        <p className="text-sm text-base-content/70">
          過去のゼミ会（受講生会）の記録です。
        </p>
      </div>

      <ul className="grid gap-2">
        {meetings.map((m) => (
          <li key={m.id}>
            <Link
              href={`/meetings/${m.id}`}
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
            まだゼミ会がありません。
          </li>
        )}
      </ul>
    </section>
  );
}
