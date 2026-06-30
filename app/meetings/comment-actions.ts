"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import {
  addComment,
  deleteComment,
  getComment,
  updateComment,
} from "@/db/comments";
import { getMeeting } from "@/db/meetings";
import { getUserMastodonToken } from "@/db/users";
import { postStatus } from "@/lib/mastodon";

type Result = { ok: boolean; error?: string; tootWarning?: string };

/** コメント本文からトゥート文面を組み立て、本人名義で投稿。失敗時は警告文を返す。 */
async function tryToot(
  userId: string,
  meetingId: string,
  body: string,
): Promise<string | undefined> {
  const instance = process.env.MASTODON_INSTANCE;
  const token = await getUserMastodonToken(userId);
  if (!instance || !token) {
    return "Mastodon連携の再ログインが必要です（投稿はスキップしました）";
  }
  const meeting = await getMeeting(meetingId);
  // Mastodonのハッシュタグは数字のみだと無効なため先頭に d を付ける（例: #d20260701）
  const date = meeting ? meeting.heldOn.replaceAll("-", "") : "";
  const status = `${body}\n\n#WEB開発ゼミ #ゼミ会 #d${date}`;
  try {
    await postStatus({ instance, token, status, visibility: "public" });
    return undefined;
  } catch {
    return "Mastodonへの投稿に失敗しました（再ログインが必要かもしれません）";
  }
}

/** コメント投稿（ログインユーザー全員）。alsoToot=true でMastodonにも投稿。 */
export async function postComment(
  meetingId: string,
  body: string,
  alsoToot = false,
): Promise<Result> {
  const session = await requireUser();
  const text = body.trim();
  if (!text) return { ok: false, error: "コメントを入力してください" };
  await addComment(meetingId, session.user.id, text);
  revalidatePath(`/meetings/${meetingId}`);

  let tootWarning: string | undefined;
  if (alsoToot) {
    tootWarning = await tryToot(session.user.id, meetingId, text);
  }
  return { ok: true, tootWarning };
}

/** 投稿者本人 or staff のみ許可。 */
async function authorizeOwnerOrStaff(commentId: string) {
  const session = await requireUser();
  const comment = await getComment(commentId);
  if (!comment) return { error: "コメントが見つかりません" as const };
  const isOwner = comment.userId === session.user.id;
  const isStaff = session.user.role === "staff";
  if (!isOwner && !isStaff) return { error: "権限がありません" as const };
  return { comment };
}

export async function editComment(
  commentId: string,
  body: string,
): Promise<Result> {
  const text = body.trim();
  if (!text) return { ok: false, error: "コメントを入力してください" };
  const auth = await authorizeOwnerOrStaff(commentId);
  if ("error" in auth) return { ok: false, error: auth.error };
  await updateComment(commentId, text);
  revalidatePath(`/meetings/${auth.comment.meetingId}`);
  return { ok: true };
}

export async function removeComment(commentId: string): Promise<Result> {
  const auth = await authorizeOwnerOrStaff(commentId);
  if ("error" in auth) return { ok: false, error: auth.error };
  await deleteComment(commentId);
  revalidatePath(`/meetings/${auth.comment.meetingId}`);
  return { ok: true };
}
