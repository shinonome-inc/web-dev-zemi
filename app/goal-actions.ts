"use server";

import { requireUser } from "@/lib/auth-guard";
import { getUserMastodonToken } from "@/db/users";
import { postStatus } from "@/lib/mastodon";

const MASTODON_MAX_CHARS = 500;

/** 今日の目標を本人名義でPGrit（Mastodon）に投稿する。 */
export async function postGoal(
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  const body = text.trim();
  if (!body) return { ok: false, error: "目標を入力してください" };

  const instance = process.env.MASTODON_INSTANCE;
  const token = await getUserMastodonToken(session.user.id);
  if (!instance || !token) {
    return { ok: false, error: "Mastodonでの再ログインが必要です" };
  }

  const footer = "\n\n#PGrit";
  const max = MASTODON_MAX_CHARS - footer.length;
  const status =
    (body.length > max ? `${body.slice(0, max - 1)}…` : body) + footer;

  try {
    await postStatus({ instance, token, status, visibility: "public" });
    return { ok: true };
  } catch (e) {
    console.error("[goal] Mastodon投稿に失敗", e);
    return { ok: false, error: "投稿に失敗しました（再ログインが必要かもしれません）" };
  }
}
