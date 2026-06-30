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
