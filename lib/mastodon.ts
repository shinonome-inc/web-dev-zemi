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
 * verify_credentials 等が返す Account から last_status_at（最終トゥート日）を取り出す。
 * last_status_at は日付のみ（YYYY-MM-DD）。欠落・null・不正日付はいずれも null。
 */
export function parseLastStatusAt(payload: unknown): Date | null {
  if (typeof payload !== "object" || payload === null) return null;
  const value = (payload as { last_status_at?: unknown }).last_status_at;
  if (typeof value !== "string") return null;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * 本人アクセストークンで verify_credentials を叩き、最終トゥート日時を取得する。
 * スコープ read:accounts で取得でき、インスタンスの secure mode 等にも影響されない
 * （公開APIの無認証取得より確実）。トークン無効・取得失敗時は null。
 * 管理画面の一覧描画をブロックしないよう短いタイムアウトを設ける。
 */
export async function fetchLastStatusAtByToken(opts: {
  instance: string;
  token: string;
  timeoutMs?: number;
}): Promise<Date | null> {
  const instance = opts.instance.replace(/\/$/, "");
  try {
    const res = await fetch(
      `${instance}/api/v1/accounts/verify_credentials`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${opts.token}`,
        },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 4000),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return parseLastStatusAt(await res.json());
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
