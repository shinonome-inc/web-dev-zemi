"use client";

import { useState, useTransition } from "react";
import { changeUserRole } from "@/app/admin/actions";
import { ROLES } from "@/lib/roles";

export function RoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const [value, setValue] = useState(role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await changeUserRole(userId, next);
      if (!res.ok) {
        setValue(prev);
        setError(res.error ?? "更新に失敗しました");
      }
    });
  }

  return (
    <div>
      <select
        className="select select-bordered select-sm"
        value={value}
        disabled={pending}
        onChange={onChange}
        aria-label="ロール"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
