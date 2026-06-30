import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * staff専用ページのガード。未ログインは /login へ、staff以外は404扱い。
 * ロールはトークンではなくDBを正として判定する。
 */
export async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (row?.role !== "staff") notFound();
  return session;
}

/** ログイン必須ページのガード。未ログインは /login へ。 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}
