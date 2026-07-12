import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { decryptToken, encryptToken } from "@/lib/crypto";

/** 暗号化に失敗してもログインは止めず、トークン保存だけスキップする。 */
function safeEncryptToken(plain: string | null): string | null {
  if (plain === null) return null;
  try {
    return encryptToken(plain);
  } catch (e) {
    console.error(
      "[users] Mastodonトークンの暗号化に失敗（TOKEN_ENC_KEY未設定など）。保存をスキップします。",
      e,
    );
    return null;
  }
}

type UpsertUserInput = {
  provider: string;
  providerUid: string;
  displayName: string;
  avatarUrl?: string | null;
  mastodonAcct?: string | null;
  email?: string | null;
  /** Mastodonログイン時のみ指定。未指定なら既存値を保持 */
  mastodonAccessToken?: string | null;
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
  // トークンは指定があるときだけ更新（Google再ログイン等で既存値を消さない）。
  // 保存時にAES-256-GCMで暗号化する。
  const tokenSet =
    input.mastodonAccessToken !== undefined
      ? { mastodonAccessToken: safeEncryptToken(input.mastodonAccessToken) }
      : {};
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
      ...tokenSet,
    })
    .onConflictDoUpdate({
      target: [users.provider, users.providerUid],
      set: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl ?? null,
        mastodonAcct: input.mastodonAcct ?? null,
        lastSeenAt: now,
        ...tokenSet,
      },
    })
    .returning({ id: users.id, role: users.role });

  return row;
}

/** 本人名義の投稿に使う Mastodon アクセストークンを取得。 */
export async function getUserMastodonToken(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ token: users.mastodonAccessToken })
    .from(users)
    .where(eq(users.id, userId));
  return row?.token ? decryptToken(row.token) : null;
}

/** アクセス日時（lastSeenAt）を現在時刻に更新する（最終アクセス検知用）。 */
export async function updateLastSeen(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.id, userId));
}

/** DB上のロールを取得（権限判定はJWTでなくDBを正とするため）。不在なら null。 */
export async function getUserRole(
  userId: string,
): Promise<(typeof users.$inferSelect)["role"] | null> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));
  return row?.role ?? null;
}

/** provider + providerUid で既存ユーザーを引く。ログイン可否判定（除名チェック）に使う。 */
export async function findUserByProvider(
  provider: string,
  providerUid: string,
): Promise<{ id: string; archivedAt: Date | null } | null> {
  const [row] = await db
    .select({ id: users.id, archivedAt: users.archivedAt })
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.providerUid, providerUid)));
  return row ?? null;
}
