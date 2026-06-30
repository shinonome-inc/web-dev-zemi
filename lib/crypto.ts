import crypto from "node:crypto";

// AES-256-GCM による文字列の暗号化/復号。
// 鍵は env TOKEN_ENC_KEY（32バイトをbase64）。DBとは別管理にすることで、
// DBダンプ単体ではトークンを復号できないようにする。
const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const b64 = process.env.TOKEN_ENC_KEY;
  if (!b64) throw new Error("TOKEN_ENC_KEY is not set");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENC_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

/** 平文を暗号化し `iv.tag.ciphertext`(各base64) 形式の文字列で返す。 */
export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

/** encryptToken の逆。復号できない（鍵違い/旧平文/破損）場合は null。 */
export function decryptToken(payload: string): string | null {
  try {
    const [ivB64, tagB64, encB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !encB64) return null;
    const decipher = crypto.createDecipheriv(
      ALGO,
      getKey(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(encB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
