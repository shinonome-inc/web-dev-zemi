import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth-guard";
import {
  getAttendeeIds,
  getMeeting,
  listAttendableUsers,
} from "@/db/meetings";
import { MeetingForm } from "@/components/meeting-form";
import { AttendanceEditor } from "@/components/attendance-editor";
import { DeleteMeetingButton } from "@/components/delete-meeting-button";
import { isUuid } from "@/lib/validation";

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  const [users, attendeeIds] = await Promise.all([
    listAttendableUsers(),
    getAttendeeIds(id),
  ]);

  return (
    <section className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/meetings"
            className="link link-hover text-sm text-base-content/60"
          >
            ← ゼミ会管理
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">ゼミ会の編集</h1>
        </div>
        <DeleteMeetingButton id={meeting.id} />
      </div>

      <MeetingForm meeting={meeting}>
        <div className="space-y-3 border-t border-base-300 pt-6">
          <h2 className="font-bold">
            出席管理
            <span className="ml-2 text-sm font-normal text-base-content/60">
              ({attendeeIds.length}人 出席)
            </span>
          </h2>
          <AttendanceEditor
            meetingId={meeting.id}
            users={users}
            attendeeIds={attendeeIds}
          />
        </div>
      </MeetingForm>
    </section>
  );
}
