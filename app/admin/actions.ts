"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth-guard";
import { countStaff, getUserById, updateUserRole } from "@/db/admin";
import { ROLES, type Role } from "@/lib/roles";

/** staffがユーザーのロールを変更する。最後のstaffの降格は拒否する。 */
export async function changeUserRole(
  userId: string,
  role: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();

  if (!ROLES.includes(role as Role)) {
    return { ok: false, error: "不正なロールです" };
  }

  const target = await getUserById(userId);
  if (!target) return { ok: false, error: "ユーザーが見つかりません" };

  // staffが0人にならないようガード（UIからのロックアウト防止）
  if (target.role === "staff" && role !== "staff" && (await countStaff()) <= 1) {
    return { ok: false, error: "最後のstaffは降格できません" };
  }

  await updateUserRole(userId, role as Role);
  revalidatePath("/admin");
  return { ok: true };
}
