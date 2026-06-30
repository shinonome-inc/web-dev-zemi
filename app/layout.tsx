import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "はじめてのWEB開発ゼミ ポータル",
  description:
    "AI駆動開発を学ぶ「はじめてのWEB開発ゼミ」の学習ポータル。カリキュラムの閲覧と進捗管理を行います。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <a className="app-brand" href="/">
              はじめてのWEB開発ゼミ
            </a>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">
            <small>はじめてのWEB開発ゼミ ポータル</small>
          </footer>
        </div>
      </body>
    </html>
  );
}
