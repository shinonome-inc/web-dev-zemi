"use client";

import { useTransition } from "react";
import { removeMeeting } from "@/app/admin/meetings/actions";

export function DeleteMeetingButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-outline btn-error btn-sm"
      disabled={pending}
      onClick={() => {
        if (window.confirm("このゼミ会を削除しますか？（元に戻せません）")) {
          startTransition(() => removeMeeting(id));
        }
      }}
    >
      削除
    </button>
  );
}
