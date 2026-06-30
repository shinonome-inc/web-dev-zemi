import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { MeetingForm } from "@/components/meeting-form";

export const metadata = { title: "ゼミ会の新規作成 | はじめてのWEB開発ゼミ" };

export default async function NewMeetingPage() {
  await requireStaff();

  return (
    <section className="space-y-6">
      <div>
        <Link
          href="/admin/meetings"
          className="link link-hover text-sm text-base-content/60"
        >
          ← ゼミ会管理
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">ゼミ会の新規作成</h1>
      </div>
      <MeetingForm />
    </section>
  );
}
