"use server";

import { requireUser } from "@/lib/auth-guard";
import { getCompletedItemIds, setProgress } from "@/db/progress";
import { isValidProgressItem } from "@/lib/curriculum";

/** ログインユーザーの、指定週の完了済み項目IDを返す。未ログイン・除名済みは /login へ。 */
export async function getMyProgress(weekSlug: string): Promise<string[]> {
  const session = await requireUser();
  return getCompletedItemIds(session.user.id, weekSlug);
}

/** 進捗項目のON/OFFを保存する。 */
export async function toggleProgress(
  itemId: string,
  weekSlug: string,
  completed: boolean,
): Promise<void> {
  const session = await requireUser();
  // カリキュラムに実在する項目のみ許可（偽の進捗による集計汚染・行増殖を防ぐ）
  if (!isValidProgressItem(itemId, weekSlug)) {
    throw new Error("不正な進捗項目です");
  }
  await setProgress(session.user.id, itemId, weekSlug, completed);
}
