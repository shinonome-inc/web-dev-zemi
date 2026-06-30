import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { meetingComments, users } from "./schema";

export type CommentWithAuthor = {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  authorName: string;
};

/** 指定ゼミ会のコメント一覧（投稿の古い順、投稿者名つき）。 */
export async function listComments(
  meetingId: string,
): Promise<CommentWithAuthor[]> {
  return db
    .select({
      id: meetingComments.id,
      body: meetingComments.body,
      createdAt: meetingComments.createdAt,
      userId: meetingComments.userId,
      authorName: users.displayName,
    })
    .from(meetingComments)
    .innerJoin(users, eq(users.id, meetingComments.userId))
    .where(eq(meetingComments.meetingId, meetingId))
    .orderBy(asc(meetingComments.createdAt));
}

export async function getComment(id: string) {
  const [row] = await db
    .select()
    .from(meetingComments)
    .where(eq(meetingComments.id, id));
  return row ?? null;
}

export async function addComment(
  meetingId: string,
  userId: string,
  body: string,
): Promise<void> {
  await db.insert(meetingComments).values({ meetingId, userId, body });
}

export async function updateComment(id: string, body: string): Promise<void> {
  await db
    .update(meetingComments)
    .set({ body, updatedAt: new Date() })
    .where(eq(meetingComments.id, id));
}

export async function deleteComment(id: string): Promise<void> {
  await db.delete(meetingComments).where(eq(meetingComments.id, id));
}
