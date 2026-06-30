/** ユーザーロールの定義（クライアント/サーバー共通で使う通常モジュール） */
export const ROLES = ["student", "staff", "graduate"] as const;
export type Role = (typeof ROLES)[number];
