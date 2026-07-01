"use server";

import { requireUser } from "@/lib/auth-guard";
import { getUserMastodonToken } from "@/db/users";
import { buildStatusWithFooter, postStatus } from "@/lib/mastodon";
import { LIMITS } from "@/lib/validation";

/** 今日の目標を本人名義でPGrit（Mastodon）に投稿する。 */
export async function postGoal(
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireUser();
  const body = text.trim();
  if (!body) return { ok: false, error: "目標を入力してください" };
  if (body.length > LIMITS.goalBody) {
    return {
      ok: false,
      error: `目標は${LIMITS.goalBody}文字以内で入力してください`,
    };
  }

  const instance = process.env.MASTODON_INSTANCE;
  const token = await getUserMastodonToken(session.user.id);
  if (!instance || !token) {
    return { ok: false, error: "PGritでの再ログインが必要です" };
  }

  const status = buildStatusWithFooter(body, "\n\n#WEB開発ゼミ #本日の目標");

  try {
    await postStatus({ instance, token, status, visibility: "public" });
    return { ok: true };
  } catch (e) {
    console.error("[goal] Mastodon投稿に失敗", e);
    return { ok: false, error: "投稿に失敗しました（再ログインが必要かもしれません）" };
  }
}
