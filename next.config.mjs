/** @type {import('next').NextConfig} */

// 全ルートに付与するセキュリティヘッダー（多層防御）。
// CSPはNextのインラインスクリプト都合で全面導入は避け、クリックジャッキング対策の
// frame-ancestors のみ最小限で有効化する。HSTSはVercelが自動付与するため省略。
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
