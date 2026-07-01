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
