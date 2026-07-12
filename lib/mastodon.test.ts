import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildStatusWithFooter,
  fetchLastStatusAt,
  MASTODON_MAX_CHARS,
  parseLatestStatusAt,
} from "./mastodon";

describe("parseLatestStatusAt", () => {
  it("配列先頭の created_at を Date で返す", () => {
    const at = parseLatestStatusAt([
      { created_at: "2026-07-01T12:00:00.000Z" },
      { created_at: "2026-06-01T00:00:00.000Z" },
    ]);
    expect(at?.toISOString()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("空配列は null", () => {
    expect(parseLatestStatusAt([])).toBeNull();
  });

  it("配列でない入力は null", () => {
    expect(parseLatestStatusAt(null)).toBeNull();
    expect(parseLatestStatusAt({ created_at: "2026-07-01T00:00:00Z" })).toBeNull();
    expect(parseLatestStatusAt("2026-07-01")).toBeNull();
  });

  it("created_at 欠落・非文字列・不正日付は null", () => {
    expect(parseLatestStatusAt([{}])).toBeNull();
    expect(parseLatestStatusAt([{ created_at: 12345 }])).toBeNull();
    expect(parseLatestStatusAt([{ created_at: "not-a-date" }])).toBeNull();
  });
});

describe("fetchLastStatusAt", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200応答なら最新投稿日時を返し、末尾スラッシュを正規化したURLを叩く", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ created_at: "2026-07-01T00:00:00.000Z" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const at = await fetchLastStatusAt({
      instance: "https://pgrit.example/",
      accountId: "42",
    });

    expect(at?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://pgrit.example/api/v1/accounts/42/statuses?limit=1",
    );
  });

  it("非200応答は null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => [] }),
    );
    expect(
      await fetchLastStatusAt({ instance: "https://x", accountId: "1" }),
    ).toBeNull();
  });

  it("fetch が例外（タイムアウト等）なら null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(
      await fetchLastStatusAt({ instance: "https://x", accountId: "1" }),
    ).toBeNull();
  });
});

describe("buildStatusWithFooter", () => {
  it("上限内ならそのまま連結する", () => {
    expect(buildStatusWithFooter("やること", "\n#tag")).toBe("やること\n#tag");
  });

  it("超過時は本文を切り詰めても全体が上限以内に収まる", () => {
    const footer = "\n\n#WEB開発ゼミ";
    const body = "あ".repeat(MASTODON_MAX_CHARS + 100);
    const result = buildStatusWithFooter(body, footer);
    expect(Array.from(result).length).toBeLessThanOrEqual(MASTODON_MAX_CHARS);
    expect(result.endsWith(footer)).toBe(true);
    expect(result).toContain("…");
  });
});
