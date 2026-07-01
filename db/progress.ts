import { and, count, eq, gte } from "drizzle-orm";
import { db } from "./index";
import { progress } from "./schema";

/** 指定ユーザーの完了済み項目ID（全週）。 */
export async function getAllCompletedItemIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ itemId: progress.itemId })
    .from(progress)
    .where(eq(progress.userId, userId));
  return rows.map((r) => r.itemId);
}

/** 指定ユーザーが `since` 以降にチェックした件数（今週のチェック数などに使う）。 */
export async function getWeeklyCheckCount(
  userId: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(progress)
    .where(
      and(eq(progress.userId, userId), gte(progress.completedAt, since)),
    );
  return row?.c ?? 0;
}

/** 指定ユーザーの、ある週の完了済み項目ID一覧を返す。 */
export async function getCompletedItemIds(
  userId: string,
  weekSlug: string,
): Promise<string[]> {
  const rows = await db
    .select({ itemId: progress.itemId })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.weekSlug, weekSlug)));
  return rows.map((row) => row.itemId);
}

/** 進捗項目の完了状態を保存する（完了=行を作成 / 未完了=行を削除）。 */
export async function setProgress(
  userId: string,
  itemId: string,
  weekSlug: string,
  completed: boolean,
): Promise<void> {
  if (completed) {
    await db
      .insert(progress)
      .values({ userId, itemId, weekSlug })
      .onConflictDoNothing();
  } else {
    await db
      .delete(progress)
      .where(and(eq(progress.userId, userId), eq(progress.itemId, itemId)));
  }
}
