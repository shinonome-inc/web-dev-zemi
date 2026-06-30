"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { getMyProgress, toggleProgress } from "@/app/curriculum/actions";
import type { ChecklistItem } from "@/lib/curriculum";

export function ProgressChecklist({
  items,
  weekSlug,
}: {
  items: ChecklistItem[];
  weekSlug: string;
}) {
  const { status } = useSession();
  const loggedIn = status === "authenticated";
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!loggedIn) {
      setLoaded(true);
      return;
    }
    let active = true;
    getMyProgress(weekSlug).then((ids) => {
      if (active) {
        setCompleted(new Set(ids));
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [loggedIn, weekSlug]);

  if (items.length === 0) return null;

  function flip(id: string, next: boolean) {
    setCompleted((prev) => {
      const set = new Set(prev);
      if (next) set.add(id);
      else set.delete(id);
      return set;
    });
  }

  function onToggle(id: string, next: boolean) {
    flip(id, next);
    startTransition(async () => {
      try {
        await toggleProgress(id, weekSlug, next);
      } catch {
        flip(id, !next); // 失敗したら元に戻す
      }
    });
  }

  const doneCount = items.filter((item) => completed.has(item.id)).length;

  return (
    <section className="not-prose my-8 rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">進捗チェック</h3>
        {loggedIn && (
          <span className="text-sm text-base-content/60">
            {doneCount}/{items.length} 完了
          </span>
        )}
      </div>

      {!loggedIn ? (
        <p className="text-sm text-base-content/70">
          進捗を記録するには{" "}
          <Link href="/login" className="link link-primary">
            ログイン
          </Link>{" "}
          してください。
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  checked={completed.has(item.id)}
                  disabled={!loaded}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                />
                <span className="text-sm">{item.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
