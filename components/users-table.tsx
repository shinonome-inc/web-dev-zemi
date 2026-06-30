"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { RoleSelect } from "@/components/role-select";
import { archiveUser } from "@/app/admin/actions";

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
  archived: boolean;
};

type SortKey = "name" | "pct" | "days";

export function UsersTable({ rows, total }: { rows: UserRow[]; total: number }) {
  const router = useRouter();
  const [key, setKey] = useState<SortKey>("days");
  const [asc, setAsc] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [pending, startTransition] = useTransition();

  function onArchive(userId: string, archived: boolean) {
    startTransition(async () => {
      const res = await archiveUser(userId, archived);
      if (!res.ok) window.alert(res.error ?? "操作に失敗しました");
      else router.refresh();
    });
  }

  const sorted = useMemo(() => {
    const copy = rows.filter((r) => showArchived || !r.archived);
    copy.sort((a, b) => {
      let d = 0;
      if (key === "name") d = a.displayName.localeCompare(b.displayName, "ja");
      else if (key === "pct") d = a.pct - b.pct;
      else d = a.daysInactive - b.daysInactive;
      return asc ? d : -d;
    });
    return copy;
  }, [rows, key, asc, showArchived]);

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
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center justify-end gap-2">
        <span className="text-sm text-base-content/70">アーカイブ済みも表示</span>
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
      </label>

      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table">
          <thead>
            <tr>
              {header("名前", "name")}
              <th>ロール</th>
              {header("進捗", "pct", "w-64")}
              {header("最終アクティブ", "days")}
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr
                key={u.id}
                className={
                  u.archived
                    ? "opacity-50"
                    : u.inactive
                      ? "bg-error/10"
                      : undefined
                }
              >
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
                  {u.archived ? (
                    <span className="badge badge-ghost badge-sm">
                      アーカイブ済み
                    </span>
                  ) : u.inactive ? (
                    <span className="badge badge-error badge-sm gap-1">
                      ● 非アクティブ
                    </span>
                  ) : (
                    <span className="badge badge-success badge-sm gap-1">
                      ● アクティブ
                    </span>
                  )}
                </td>
                <td>
                  {u.archived ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      disabled={pending}
                      onClick={() => onArchive(u.id, false)}
                    >
                      復帰
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      disabled={pending}
                      onClick={() => onArchive(u.id, true)}
                    >
                      アーカイブ
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-base-content/60">
                  表示するユーザーがいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
