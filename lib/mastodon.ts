// Mastodonの本文上限（概算。コードポイントではなくUTF-16長で見るため厳密ではない）
export const MASTODON_MAX_CHARS = 500;

/**
 * 本文＋フッターを上限内に収める。超過分は本文側を切り詰める。
 * サロゲートペア（絵文字等）の境界で分割しないよう Array.from で1コードポイント単位に扱う。
 */
export function buildStatusWithFooter(body: string, footer: string): string {
  const max = MASTODON_MAX_CHARS - footer.length;
  if (body.length <= max) return `${body}${footer}`;
  const chars = Array.from(body);
  const trimmed = chars.slice(0, Math.max(0, max - 1)).join("");
  return `${trimmed}…${footer}`;
}

/**
 * accounts/:id/statuses のレスポンス（配列）から最新ステータスの投稿日時を取り出す。
 * 配列でない・空・created_at 欠落・不正日付はいずれも null。
 */
export function parseLatestStatusAt(payload: unknown): Date | null {
  if (!Array.isArray(payload)) return null;
  const first = payload[0] as { created_at?: unknown } | undefined;
  if (!first || typeof first.created_at !== "string") return null;
  const at = new Date(first.created_at);
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * 指定 Mastodon アカウントの「最終トゥート日時」を公開APIから取得する。
 * 認証不要（公開・未収載の投稿が対象）。鍵アカウントや取得失敗時は null。
 * 管理画面の一覧描画をブロックしないよう短いタイムアウトを設ける。
 */
export async function fetchLastStatusAt(opts: {
  instance: string;
  accountId: string;
  timeoutMs?: number;
}): Promise<Date | null> {
  const instance = opts.instance.replace(/\/$/, "");
  const url = `${instance}/api/v1/accounts/${encodeURIComponent(
    opts.accountId,
  )}/statuses?limit=1`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 4000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return parseLatestStatusAt(await res.json());
  } catch {
    // ネットワーク不通・タイムアウト・JSON崩れなどは「取得不可」として扱う
    return null;
  }
}

/** Mastodonに本人名義でステータス（トゥート）を投稿する。 */
export async function postStatus(opts: {
  instance: string;
  token: string;
  status: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
}): Promise<void> {
  const instance = opts.instance.replace(/\/$/, "");
  const res = await fetch(`${instance}/api/v1/statuses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: opts.status,
      visibility: opts.visibility ?? "public",
    }),
  });
  if (!res.ok) {
    throw new Error(`Mastodon API error: ${res.status}`);
  }
}
