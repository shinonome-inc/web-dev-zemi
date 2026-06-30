import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import { upsertUser } from "@/db/users";

/** Mastodon の verify_credentials が返すプロフィール（必要分のみ） */
interface MastodonProfile {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  avatar: string;
  url: string;
}

/** コミュニティの Mastodon インスタンス向けカスタム OAuth プロバイダ */
function Mastodon(
  options: OAuthUserConfig<MastodonProfile> & { instance: string },
): OAuthConfig<MastodonProfile> {
  const instance = options.instance.replace(/\/$/, "");
  return {
    id: "mastodon",
    name: "Mastodon",
    type: "oauth",
    authorization: {
      url: `${instance}/oauth/authorize`,
      params: { scope: "read:accounts" },
    },
    token: `${instance}/oauth/token`,
    userinfo: `${instance}/api/v1/accounts/verify_credentials`,
    // state(暗号化JWE)はURLが長くなりMastodon側の認可処理が502になることがあるため、
    // 短いcode_challengeで済むPKCEを使う（Mastodon 4.3+対応）。
    checks: ["pkce"],
    profile(profile) {
      return {
        id: profile.id,
        name: profile.display_name || profile.username,
        image: profile.avatar,
      };
    },
    options,
  };
}

/** env に設定があるプロバイダのみ有効化する（Mastodon必須・Google任意） */
function buildProviders() {
  const providers = [];

  const { MASTODON_INSTANCE, MASTODON_CLIENT_ID, MASTODON_CLIENT_SECRET } =
    process.env;
  if (MASTODON_INSTANCE && MASTODON_CLIENT_ID && MASTODON_CLIENT_SECRET) {
    providers.push(
      Mastodon({
        instance: MASTODON_INSTANCE,
        clientId: MASTODON_CLIENT_ID,
        clientSecret: MASTODON_CLIENT_SECRET,
      }),
    );
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  return providers;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: buildProviders(),
  session: { strategy: "jwt" },
  callbacks: {
    // サインイン時にユーザーをDBへupsertし、DBのユーザーID・provider・acctをtokenに持たせる
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        const acct =
          account.provider === "mastodon" && profile
            ? (profile as unknown as MastodonProfile).acct
            : undefined;
        token.provider = account.provider;
        token.acct = acct;
        token.uid = await upsertUser({
          provider: account.provider,
          providerUid: account.providerAccountId,
          displayName: user.name ?? "(no name)",
          avatarUrl: user.image,
          mastodonAcct: acct,
          email: user.email,
        });
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.provider = token.provider as string | undefined;
      session.user.acct = token.acct as string | undefined;
      return session;
    },
  },
});
