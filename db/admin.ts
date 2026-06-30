import { count, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { progress, users } from "./schema";

export type UserProgressSummary = {
  id: string;
  displayName: string;
  mastodonAcct: string | null;
  role: (typeof users.$inferSelect)["role"];
  lastSeenAt: Date;
  completed: number;
};

/** 全ユーザーの基本情報と完了項目数を返す（最終ログインの新しい順）。 */
export async function getUsersProgressSummary(): Promise<UserProgressSummary[]> {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      mastodonAcct: users.mastodonAcct,
      role: users.role,
      lastSeenAt: users.lastSeenAt,
      completed: count(progress.id),
    })
    .from(users)
    .leftJoin(progress, eq(progress.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.lastSeenAt));
}

/** 指定ユーザーの基本情報。 */
export async function getUserById(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return row ?? null;
}

/** 指定ユーザーの完了済み項目ID（全週）。 */
export async function getAllCompletedItemIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ itemId: progress.itemId })
    .from(progress)
    .where(eq(progress.userId, userId));
  return rows.map((r) => r.itemId);
}
