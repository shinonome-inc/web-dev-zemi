import { db } from "./index";
import { users } from "./schema";

type UpsertUserInput = {
  provider: string;
  providerUid: string;
  displayName: string;
  avatarUrl?: string | null;
  mastodonAcct?: string | null;
  email?: string | null;
};

/**
 * ログイン時にユーザーを作成 or 更新し、DB上のID・ロールを返す。
 * role は更新対象に含めない（新規は既定の 'student'、既存はDBの値を保持）。
 * staffへの昇格はDBを直接書き換えて運用する。
 */
export async function upsertUser(
  input: UpsertUserInput,
): Promise<{ id: string; role: (typeof users.$inferSelect)["role"] }> {
  const now = new Date();
  const [row] = await db
    .insert(users)
    .values({
      provider: input.provider,
      providerUid: input.providerUid,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl ?? null,
      mastodonAcct: input.mastodonAcct ?? null,
      email: input.email ?? null,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: [users.provider, users.providerUid],
      set: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl ?? null,
        mastodonAcct: input.mastodonAcct ?? null,
        lastSeenAt: now,
      },
    })
    .returning({ id: users.id, role: users.role });

  return row;
}
