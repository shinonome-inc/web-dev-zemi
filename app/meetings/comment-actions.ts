"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-guard";
import {
  addComment,
  deleteComment,
  getComment,
  updateComment,
} from "@/db/comments";

type Result = { ok: boolean; error?: string };

/** コメント投稿（ログインユーザー全員）。 */
export async function postComment(
  meetingId: string,
  body: string,
): Promise<Result> {
  const session = await requireUser();
  const text = body.trim();
  if (!text) return { ok: false, error: "コメントを入力してください" };
  await addComment(meetingId, session.user.id, text);
  revalidatePath(`/meetings/${meetingId}`);
  return { ok: true };
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
