"use server";

import { auth } from "@/auth";
import { getCompletedItemIds, setProgress } from "@/db/progress";

/** ログインユーザーの、指定週の完了済み項目IDを返す（未ログインは空）。 */
export async function getMyProgress(weekSlug: string): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return getCompletedItemIds(session.user.id, weekSlug);
}

/** 進捗項目のON/OFFを保存する。 */
export async function toggleProgress(
  itemId: string,
  weekSlug: string,
  completed: boolean,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");
  await setProgress(session.user.id, itemId, weekSlug, completed);
}
