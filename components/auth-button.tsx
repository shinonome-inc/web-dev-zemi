"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="loading loading-spinner loading-sm" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className="btn btn-primary btn-sm">
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-base-content/80">{session.user.name}</span>
      <button
        type="button"
        onClick={() => signOut()}
        className="btn btn-ghost btn-sm"
      >
        ログアウト
      </button>
    </div>
  );
}
