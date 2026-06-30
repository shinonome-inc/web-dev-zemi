import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      provider?: string;
      /** Mastodonのアカウント識別子（例: user@instance） */
      acct?: string;
    } & DefaultSession["user"];
  }
}

