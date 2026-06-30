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
  attendanceCount: number;
};

type SortKey = "name" | "pct" | "days" | "attend";

/** 状態表示：背景なし・光る丸マーク＋色付き文字 */
function StatusIndicator({
  archived,
  inactive,
}: {
  archived: boolean;
  inactive: boolean;
}) {
  if (archived) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-base-content/50">
        <span className="h-2 w-2 shrink-0 rounded-full bg-current" />
        アーカイブ済み
      </span>
    );
  }
  const color = inactive ? "text-error" : "text-success";
  const label = inactive ? "非アクティブ" : "アクティブ";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium ${color}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-current shadow-[0_0_6px_2px_currentColor]" />
      {label}
    </span>
  );
}

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
      else if (key === "attend") d = a.attendanceCount - b.attendanceCount;
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
              {header("進捗", "pct", "w-48")}
              {header("ゼミ会参加", "attend")}
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
                      className="progress progress-primary w-20 shrink-0"
                      value={u.pct}
                      max={100}
                    />
                    <span className="whitespace-nowrap text-sm tabular-nums">
                      {u.pct}%（{u.completed}/{total}）
                    </span>
                  </div>
                </td>
                <td className="text-sm tabular-nums">{u.attendanceCount}回</td>
                <td className="text-sm text-base-content/70">
                  {u.lastActiveLabel}
                  <div className="text-xs text-base-content/50">
                    {u.daysInactive}日前
                  </div>
                </td>
                <td>
                  <StatusIndicator archived={u.archived} inactive={u.inactive} />
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
                <td colSpan={7} className="text-center text-base-content/60">
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
