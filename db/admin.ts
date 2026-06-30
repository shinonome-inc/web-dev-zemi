import { count, desc, eq, max } from "drizzle-orm";
import { db } from "./index";
import { progress, users } from "./schema";

export type UserProgressSummary = {
  id: string;
  displayName: string;
  mastodonAcct: string | null;
  role: (typeof users.$inferSelect)["role"];
  lastSeenAt: Date;
  /** 最後に進捗チェックした日時（未チェックなら null） */
  lastCheckedAt: Date | null;
  /** 非表示（アーカイブ）日時。null=表示中 */
  archivedAt: Date | null;
  completed: number;
};

/** 全ユーザーの基本情報・完了項目数・最終チェック日時を返す。 */
export async function getUsersProgressSummary(): Promise<UserProgressSummary[]> {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      mastodonAcct: users.mastodonAcct,
      role: users.role,
      lastSeenAt: users.lastSeenAt,
      lastCheckedAt: max(progress.completedAt),
      archivedAt: users.archivedAt,
      completed: count(progress.id),
    })
    .from(users)
    .leftJoin(progress, eq(progress.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.lastSeenAt));
}

/** ユーザーの非表示（アーカイブ）状態を切り替える。 */
export async function setUserArchived(
  userId: string,
  archived: boolean,
): Promise<void> {
  await db
    .update(users)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(users.id, userId));
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

/** staffロールのユーザー数。 */
export async function countStaff(): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(users)
    .where(eq(users.role, "staff"));
  return row?.c ?? 0;
}

/** ユーザーのロールを更新する。 */
export async function updateUserRole(
  userId: string,
  role: (typeof users.$inferSelect)["role"],
): Promise<void> {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}
