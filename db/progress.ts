import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { progress } from "./schema";

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
