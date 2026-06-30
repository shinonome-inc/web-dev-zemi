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
      <body className="min-h-screen bg-base-200 text-base-content">
        <div className="flex min-h-screen flex-col">
          <header className="navbar border-b border-base-300 bg-base-100">
            <div className="mx-auto w-full max-w-5xl px-4">
              <a href="/" className="text-lg font-bold">
                はじめてのWEB開発ゼミ
              </a>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
            {children}
          </main>

          <footer className="border-t border-base-300 py-6 text-center text-sm text-base-content/60">
            はじめてのWEB開発ゼミ ポータル
          </footer>
        </div>
      </body>
    </html>
  );
}
