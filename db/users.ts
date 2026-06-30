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

/** ログイン時にユーザーを作成 or 更新し、DB上のユーザーIDを返す。 */
export async function upsertUser(input: UpsertUserInput): Promise<string> {
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
    .returning({ id: users.id });

  return row.id;
}
