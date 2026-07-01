import { and, asc, count, eq, gte } from "drizzle-orm";
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

export async function deleteComment(id: string): Promise<void> {
  await db.delete(meetingComments).where(eq(meetingComments.id, id));
}

/** 指定ユーザーが `since` 以降に投稿したコメント数（連投レート制限用）。 */
export async function countRecentComments(
  userId: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(meetingComments)
    .where(
      and(
        eq(meetingComments.userId, userId),
        gte(meetingComments.createdAt, since),
      ),
    );
  return row?.c ?? 0;
}
