import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * 現在ログイン中ユーザーのロールとアーカイブ状態をDBから取得する。
 * ロール・除名判定はJWTではなくDBを正とする（降格・除名を即時反映するため）。
 */
async function currentUserState(userId: string) {
  const [row] = await db
    .select({ role: users.role, archivedAt: users.archivedAt })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

/** ログイン必須ページのガード。未ログイン・DB不在・アーカイブ（除名）済みは /login へ。 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const state = await currentUserState(session.user.id);
  // 除名（アーカイブ）済みはJWTが有効でもアクセスを遮断する
  if (!state || state.archivedAt) redirect("/login");

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

  return session;
}
