"use client";

import { useState, useTransition } from "react";
import { postGoal } from "@/app/goal-actions";

export function PgritComposer({ canPost }: { canPost: boolean }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onPost() {
    setMsg(null);
    startTransition(async () => {
      const res = await postGoal(text);
      if (res.ok) {
        setText("");
        setMsg("PGritに投稿しました 🎉");
      } else {
        setMsg(res.error ?? "投稿に失敗しました");
      }
    });
  }

  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3">
        <h2 className="card-title text-base">今日の目標をPGritに投稿</h2>
        {canPost ? (
          <>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              rows={3}
              placeholder="今日やることを宣言しよう"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={pending || !text.trim()}
                onClick={onPost}
              >
                投稿
              </button>
              {msg && (
                <span className="text-sm text-base-content/70">{msg}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-base-content/70">
            Mastodonでログインすると投稿できます。
          </p>
        )}
      </div>
    </div>
  );
}
