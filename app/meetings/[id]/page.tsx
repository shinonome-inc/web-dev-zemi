import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireUser } from "@/lib/auth-guard";
import { getAttendeeIds, getMeeting } from "@/db/meetings";
import { listComments } from "@/db/comments";
import { CommentSection } from "@/components/comment-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await getMeeting(id);
  return {
    title: meeting
      ? `${meeting.title} | ゼミ会アーカイブ`
      : "ゼミ会アーカイブ",
  };
}

export default async function MeetingArchiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  const attendeeIds = await getAttendeeIds(id);
  const attended = attendeeIds.includes(session.user.id);

  const isStaff = session.user.role === "staff";
  const comments = (await listComments(id)).map((c) => ({
    id: c.id,
    body: c.body,
    authorName: c.authorName,
    createdAtLabel: new Date(c.createdAt).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    canModify: c.userId === session.user.id || isStaff,
  }));

  return (
    <article className="space-y-6">
      <div className="text-sm">
        <Link href="/meetings" className="link link-hover text-base-content/60">
          ← ゼミ会アーカイブ
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-base-content/60">
            {meeting.heldOn}
          </span>
          {attended ? (
            <span className="badge badge-success badge-sm">出席</span>
          ) : (
            <span className="badge badge-ghost badge-sm">記録なし</span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
      </div>

      {meeting.slideUrl && (
        <a
          href={meeting.slideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
        >
          資料を開く ↗
        </a>
      )}

      {meeting.contentMd.trim() && (
        <div className="prose max-w-none prose-a:text-primary">
          <Markdown remarkPlugins={[remarkGfm]}>{meeting.contentMd}</Markdown>
        </div>
      )}

      <CommentSection
        meetingId={meeting.id}
        comments={comments}
        canToot={session.user.provider === "mastodon"}
      />
    </article>
  );
}
