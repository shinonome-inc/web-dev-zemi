import { and, count, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { meetingAttendance, meetings, users } from "./schema";

/** 指定ユーザーのゼミ会参加回数。 */
export async function getAttendanceCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(meetingAttendance)
    .where(eq(meetingAttendance.userId, userId));
  return row?.c ?? 0;
}

export type MeetingInput = {
  heldOn: string;
  title: string;
  contentMd: string;
  slideUrl: string | null;
};

/** ゼミ会一覧（開催日の新しい順）。 */
export async function listMeetings() {
  return db.select().from(meetings).orderBy(desc(meetings.heldOn));
}

/** 1件取得。無ければ null。 */
export async function getMeeting(id: string) {
  const [row] = await db.select().from(meetings).where(eq(meetings.id, id));
  return row ?? null;
}

export async function createMeeting(input: MeetingInput): Promise<string> {
  const [row] = await db
    .insert(meetings)
    .values(input)
    .returning({ id: meetings.id });
  return row.id;
}

export async function updateMeeting(
  id: string,
  input: MeetingInput,
): Promise<void> {
  await db.update(meetings).set(input).where(eq(meetings.id, id));
}

export async function deleteMeeting(id: string): Promise<void> {
  await db.delete(meetings).where(eq(meetings.id, id));
}

/** 出席対象の候補（アーカイブ済みを除く全ユーザー）。 */
export async function listAttendableUsers() {
  return db
    .select({ id: users.id, displayName: users.displayName, role: users.role })
    .from(users)
    .orderBy(users.displayName);
}

/** 指定ゼミ会の出席者ユーザーID一覧。 */
export async function getAttendeeIds(meetingId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: meetingAttendance.userId })
    .from(meetingAttendance)
    .where(eq(meetingAttendance.meetingId, meetingId));
  return rows.map((r) => r.userId);
}

/** 出席のON/OFF（行の作成/削除）。 */
export async function setAttendance(
  meetingId: string,
  userId: string,
  attended: boolean,
): Promise<void> {
  if (attended) {
    await db
      .insert(meetingAttendance)
      .values({ meetingId, userId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(meetingAttendance)
      .where(
        and(
          eq(meetingAttendance.meetingId, meetingId),
          eq(meetingAttendance.userId, userId),
        ),
      );
  }
}
