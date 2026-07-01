/** サーバー側の入力検証ユーティリティ（UIの制約に依存せずServer Actionで直接使う）。 */

/** 各種テキスト入力の最大長。DB肥大化・描画負荷・スパムの歯止め。 */
export const LIMITS = {
  /** ゼミ会コメント本文 */
  commentBody: 2000,
  /** 今日の目標（Mastodon本文上限とも整合） */
  goalBody: 500,
  /** ゼミ会タイトル */
  meetingTitle: 200,
  /** ゼミ会本文（Markdown） */
  meetingContent: 50_000,
  /** 資料URL */
  slideUrl: 2000,
} as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PostgreSQLのuuidカラムへ渡す前に形式を検証する（不正値でのクエリ例外＝500を防ぐ）。 */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** http/https のみ許可するURL検証。javascript: 等の危険スキームを弾く。 */
export function isSafeHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}
