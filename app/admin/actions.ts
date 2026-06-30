"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth-guard";
import {
  countStaff,
  getUserById,
  setUserArchived,
  updateUserRole,
} from "@/db/admin";
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

/** ユーザーを非表示（アーカイブ）/復帰する。 */
export async function archiveUser(
  userId: string,
  archived: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();

  const target = await getUserById(userId);
  if (!target) return { ok: false, error: "ユーザーが見つかりません" };

  // staffをアーカイブして運営が消えないようガード
  if (archived && target.role === "staff" && (await countStaff()) <= 1) {
    return { ok: false, error: "最後のstaffはアーカイブできません" };
  }

  await setUserArchived(userId, archived);
  revalidatePath("/admin");
  return { ok: true };
}
