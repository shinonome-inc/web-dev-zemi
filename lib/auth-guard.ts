import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { updateLastSeen } from "@/db/users";

/** これより古い場合のみ lastSeenAt を更新する（毎リクエストの書き込みを避ける） */
const ACCESS_TOUCH_THROTTLE_MS = 60 * 60 * 1000;

/**
 * 現在ログイン中ユーザーのロール・アーカイブ状態・最終アクセス日時をDBから取得する。
 * ロール・除名判定はJWTではなくDBを正とする（降格・除名を即時反映するため）。
 */
async function currentUserState(userId: string) {
  const [row] = await db
    .select({
      role: users.role,
      archivedAt: users.archivedAt,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

/**
 * アクセスのたびに lastSeenAt を最新化する（＝最終アクセス日時）。
 * ログイン情報が保持されたまま翌日以降にアクセスした場合も反映される。
 * 頻繁な書き込みを避けるため、一定時間以上古いときだけ更新する。
 */
async function touchLastSeen(userId: string, lastSeenAt: Date): Promise<void> {
  if (Date.now() - lastSeenAt.getTime() < ACCESS_TOUCH_THROTTLE_MS) return;
  await updateLastSeen(userId);
}

/** ログイン必須ページのガード。未ログイン・DB不在・アーカイブ（除名）済みは /login へ。 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const state = await currentUserState(session.user.id);
  // 除名（アーカイブ）済みはJWTが有効でもアクセスを遮断する
  if (!state || state.archivedAt) redirect("/login");

  await touchLastSeen(session.user.id, state.lastSeenAt);
  return session;
}

/**
 * staff専用ページのガード。未ログイン・除名済みは /login へ、staff以外は404扱い。
 * ロールはトークンではなくDBを正として判定する。
 */
export async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const state = await currentUserState(session.user.id);
  if (!state || state.archivedAt) redirect("/login");
  if (state.role !== "staff") notFound();

  await touchLastSeen(session.user.id, state.lastSeenAt);
  return session;
}
