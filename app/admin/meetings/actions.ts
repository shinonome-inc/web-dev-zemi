"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth-guard";
import {
  createMeeting,
  deleteMeeting,
  setAttendance,
  updateMeeting,
  type MeetingInput,
} from "@/db/meetings";
import { isSafeHttpUrl, LIMITS } from "@/lib/validation";

/** 開催日が YYYY-MM-DD 形式かつ実在日付かを検証する。 */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value);
  return !Number.isNaN(time);
}

function parse(form: FormData): MeetingInput | { error: string } {
  const heldOn = String(form.get("heldOn") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const contentMd = String(form.get("contentMd") ?? "");
  const slideUrl = String(form.get("slideUrl") ?? "").trim();
  if (!heldOn) return { error: "開催日を入力してください" };
  if (!isValidDate(heldOn)) return { error: "開催日の形式が不正です" };
  if (!title) return { error: "タイトルを入力してください" };
  if (title.length > LIMITS.meetingTitle) {
    return { error: `タイトルは${LIMITS.meetingTitle}文字以内で入力してください` };
  }
  if (contentMd.length > LIMITS.meetingContent) {
    return { error: "内容が長すぎます" };
  }
  if (slideUrl) {
    if (slideUrl.length > LIMITS.slideUrl || !isSafeHttpUrl(slideUrl)) {
      return { error: "資料URLは http(s) の正しいURLを入力してください" };
    }
  }
  return { heldOn, title, contentMd, slideUrl: slideUrl || null };
}

export async function saveMeeting(
  id: string | null,
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();
  const input = parse(form);
  if ("error" in input) return { ok: false, error: input.error };

  if (id) await updateMeeting(id, input);
  else await createMeeting(input);

  revalidatePath("/admin/meetings");
  redirect("/admin/meetings");
}

export async function removeMeeting(id: string): Promise<void> {
  await requireStaff();
  await deleteMeeting(id);
  revalidatePath("/admin/meetings");
  redirect("/admin/meetings");
}

export async function toggleAttendance(
  meetingId: string,
  userId: string,
  attended: boolean,
): Promise<{ ok: boolean }> {
  await requireStaff();
  await setAttendance(meetingId, userId, attended);
  return { ok: true };
}
