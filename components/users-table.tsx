"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RoleSelect } from "@/components/role-select";

export type UserRow = {
  id: string;
  displayName: string;
  mastodonAcct: string | null;
  role: string;
  completed: number;
  pct: number;
  /** 最終アクティブ（ログイン/チェックの新しい方）の表示用 */
  lastActiveLabel: string;
  daysInactive: number;
  inactive: boolean;
};

type SortKey = "name" | "pct" | "days";

export function UsersTable({ rows, total }: { rows: UserRow[]; total: number }) {
  const [key, setKey] = useState<SortKey>("days");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let d = 0;
      if (key === "name") d = a.displayName.localeCompare(b.displayName, "ja");
      else if (key === "pct") d = a.pct - b.pct;
      else d = a.daysInactive - b.daysInactive;
      return asc ? d : -d;
    });
    return copy;
  }, [rows, key, asc]);

  function header(label: string, k: SortKey, extra = "") {
    const active = key === k;
    return (
      <th className={extra}>
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-primary"
          onClick={() => {
            if (active) setAsc(!asc);
            else {
              setKey(k);
              setAsc(false);
            }
          }}
        >
          {label}
          <span className="inline-block w-3 text-center text-xs">
            {active ? (
              asc ? (
                "▲"
              ) : (
                "▼"
              )
            ) : (
              <span className="opacity-30">↕</span>
            )}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-base-300">
      <table className="table">
        <thead>
          <tr>
            {header("名前", "name")}
            <th>ロール</th>
            {header("進捗", "pct", "w-64")}
            {header("最終アクティブ", "days")}
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => (
            <tr key={u.id} className={u.inactive ? "bg-error/10" : undefined}>
              <td>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="link link-hover font-medium"
                >
                  {u.displayName}
                </Link>
                {u.mastodonAcct && (
                  <div className="text-xs text-base-content/50">
                    {u.mastodonAcct}
                  </div>
                )}
              </td>
              <td>
                <RoleSelect userId={u.id} role={u.role} />
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <progress
                    className="progress progress-primary w-32"
                    value={u.pct}
                    max={100}
                  />
                  <span className="w-20 text-sm tabular-nums">
                    {u.pct}%（{u.completed}/{total}）
                  </span>
                </div>
              </td>
              <td className="text-sm text-base-content/70">
                {u.lastActiveLabel}
                <div className="text-xs text-base-content/50">
                  {u.daysInactive}日前
                </div>
              </td>
              <td>
                {u.inactive ? (
                  <span className="badge badge-error badge-sm gap-1">
                    ● 非アクティブ
                  </span>
                ) : (
                  <span className="badge badge-success badge-sm gap-1">
                    ● アクティブ
                  </span>
                )}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-base-content/60">
                まだユーザーがいません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
