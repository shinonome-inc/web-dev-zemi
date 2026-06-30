"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

type ProviderInfo = { id: string; name: string };

export default function LoginPage() {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);

  useEffect(() => {
    getProviders().then((res) => {
      setProviders(res ? Object.values(res) : []);
    });
  }, []);

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="text-sm text-base-content/70">
          コミュニティのアカウントでログインしてください。
        </p>
      </div>

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3">
          {providers === null && (
            <span className="loading loading-spinner loading-md mx-auto" />
          )}
          {providers?.length === 0 && (
            <p className="text-center text-sm text-error">
              ログイン方法が設定されていません。運営に連絡してください。
            </p>
          )}
          {providers?.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => signIn(p.id, { callbackUrl: "/" })}
              className="btn btn-primary btn-block"
            >
              {p.name} でログイン
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
