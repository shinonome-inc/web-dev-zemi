import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildStatusWithFooter,
  fetchLastStatusAtByToken,
  MASTODON_MAX_CHARS,
  parseLastStatusAt,
} from "./mastodon";

describe("parseLastStatusAt", () => {
  it("Account の last_status_at を Date で返す", () => {
    const at = parseLastStatusAt({ last_status_at: "2026-07-12" });
    expect(at?.getTime()).toBe(new Date("2026-07-12").getTime());
  });

  it("オブジェクトでない入力は null", () => {
    expect(parseLastStatusAt(null)).toBeNull();
    expect(parseLastStatusAt("2026-07-12")).toBeNull();
    expect(parseLastStatusAt([{ last_status_at: "2026-07-12" }])).toBeNull();
  });

  it("last_status_at の欠落・null・不正日付は null", () => {
    expect(parseLastStatusAt({})).toBeNull();
    expect(parseLastStatusAt({ last_status_at: null })).toBeNull();
    expect(parseLastStatusAt({ last_status_at: "not-a-date" })).toBeNull();
  });
});

describe("fetchLastStatusAtByToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200応答なら最終トゥート日時を返し、Bearerトークン付きで verify_credentials を叩く", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ last_status_at: "2026-07-12" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const at = await fetchLastStatusAtByToken({
      instance: "https://pgrit.example/",
      token: "secret-token",
    });

    expect(at?.getTime()).toBe(new Date("2026-07-12").getTime());
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://pgrit.example/api/v1/accounts/verify_credentials",
    );
    expect(fetchMock.mock.calls[0][1]?.headers?.Authorization).toBe(
      "Bearer secret-token",
    );
  });

  it("非200応答（トークン無効等）は null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    expect(
      await fetchLastStatusAtByToken({ instance: "https://x", token: "t" }),
    ).toBeNull();
  });

  it("fetch が例外（タイムアウト等）なら null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(
      await fetchLastStatusAtByToken({ instance: "https://x", token: "t" }),
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
