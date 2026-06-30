"use client";

import { useState, useTransition } from "react";
import { saveMeeting } from "@/app/admin/meetings/actions";
import type { Meeting } from "@/db/schema";

export function MeetingForm({
  meeting,
  children,
}: {
  meeting?: Meeting;
  children?: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await saveMeeting(meeting?.id ?? null, form);
      if (res && !res.ok) setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm" htmlFor="heldOn">
          開催日
        </label>
        <input
          id="heldOn"
          name="heldOn"
          type="date"
          required
          defaultValue={meeting?.heldOn ?? ""}
          className="input input-bordered w-full max-w-xs"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm" htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={meeting?.title ?? ""}
          className="input input-bordered w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm" htmlFor="slideUrl">
          資料URL（Google Slides / PDF など・任意）
        </label>
        <input
          id="slideUrl"
          name="slideUrl"
          type="url"
          defaultValue={meeting?.slideUrl ?? ""}
          placeholder="https://..."
          className="input input-bordered w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm" htmlFor="contentMd">
          内容（Markdown）
        </label>
        <textarea
          id="contentMd"
          name="contentMd"
          rows={12}
          defaultValue={meeting?.contentMd ?? ""}
          className="textarea textarea-bordered w-full font-mono text-sm"
        />
      </div>

      {children}

      {error && <p className="text-sm text-error">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
