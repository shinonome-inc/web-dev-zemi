"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  editComment,
  postComment,
  removeComment,
} from "@/app/meetings/comment-actions";

export type CommentView = {
  id: string;
  body: string;
  authorName: string;
  createdAtLabel: string;
  canModify: boolean;
};

export function CommentSection({
  meetingId,
  comments,
}: {
  meetingId: string;
  comments: CommentView[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [pending, startTransition] = useTransition();

  function onPost() {
    startTransition(async () => {
      const res = await postComment(meetingId, body);
      if (!res.ok) window.alert(res.error ?? "投稿に失敗しました");
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  function onSaveEdit(id: string) {
    startTransition(async () => {
      const res = await editComment(id, editBody);
      if (!res.ok) window.alert(res.error ?? "更新に失敗しました");
      else {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function onDelete(id: string) {
    if (!window.confirm("このコメントを削除しますか？")) return;
    startTransition(async () => {
      const res = await removeComment(id);
      if (!res.ok) window.alert(res.error ?? "削除に失敗しました");
      else router.refresh();
    });
  }

  return (
    <section className="space-y-4 border-t border-base-300 pt-6">
      <h2 className="font-bold">コメント（{comments.length}）</h2>

      <ul className="space-y-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-base-300 bg-base-100 p-3"
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-base-content/60">
              <span className="font-medium text-base-content/80">
                {c.authorName}
              </span>
              <span>{c.createdAtLabel}</span>
            </div>

            {editingId === c.id ? (
              <div className="space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full text-sm"
                  rows={3}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    disabled={pending}
                    onClick={() => onSaveEdit(c.id)}
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setEditingId(null)}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                {c.canModify && (
                  <div className="mt-1 flex gap-3 text-xs">
                    <button
                      type="button"
                      className="link link-hover text-base-content/60"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditBody(c.body);
                      }}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="link link-hover text-error"
                      disabled={pending}
                      onClick={() => onDelete(c.id)}
                    >
                      削除
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-base-content/60">
            まだコメントはありません。
          </li>
        )}
      </ul>

      <div className="space-y-2">
        <textarea
          className="textarea textarea-bordered w-full text-sm"
          rows={3}
          placeholder="コメントを書く…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={pending || !body.trim()}
          onClick={onPost}
        >
          投稿
        </button>
      </div>
    </section>
  );
}
