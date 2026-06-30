"use client";

import { useState, useTransition } from "react";
import { toggleAttendance } from "@/app/admin/meetings/actions";

type AttendUser = { id: string; displayName: string };

export function AttendanceEditor({
  meetingId,
  users,
  attendeeIds,
}: {
  meetingId: string;
  users: AttendUser[];
  attendeeIds: string[];
}) {
  const [present, setPresent] = useState<Set<string>>(new Set(attendeeIds));
  const [pending, startTransition] = useTransition();

  function flip(id: string, next: boolean) {
    setPresent((prev) => {
      const set = new Set(prev);
      if (next) set.add(id);
      else set.delete(id);
      return set;
    });
  }

  function onToggle(id: string, next: boolean) {
    flip(id, next);
    startTransition(async () => {
      const res = await toggleAttendance(meetingId, id, next);
      if (!res.ok) flip(id, !next);
    });
  }

  if (users.length === 0) {
    return <p className="text-sm text-base-content/60">ユーザーがいません。</p>;
  }

  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {users.map((u) => (
        <li key={u.id}>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={present.has(u.id)}
              disabled={pending}
              onChange={(e) => onToggle(u.id, e.target.checked)}
            />
            <span className="text-sm">{u.displayName}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
