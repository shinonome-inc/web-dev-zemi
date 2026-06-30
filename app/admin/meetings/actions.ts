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

function parse(form: FormData): MeetingInput | { error: string } {
  const heldOn = String(form.get("heldOn") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const contentMd = String(form.get("contentMd") ?? "");
  const slideUrl = String(form.get("slideUrl") ?? "").trim();
  if (!heldOn) return { error: "開催日を入力してください" };
  if (!title) return { error: "タイトルを入力してください" };
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
