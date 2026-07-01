# 本番デプロイ（Vercel）

ポータルは **Vercel（Hobby・無料）** にデプロイしている。DBは **Neon**（開発と本番で共用、単一DB）、認証は Auth.js（PGrit=Mastodon / Google）。

> **Production Branch は `dev`**（ポータル本体の統合先）。`main` は現状のMarkdownビューアのまま。`dev` に push すると自動で本番デプロイされる。

## 構成
- アプリ: Next.js（App Router）を Vercel が自動ビルド・デプロイ
- DB: Neon（無料枠、開発と本番で**同一DB**を使用。理由は下記）
- リポジトリ: **public**（Vercel Hobbyは組織所有のprivate repoだとProプランが必要なため。学習コミュニティ用途でもありコード公開は問題ない）

### なぜDBを分けていないか
30人規模・学習用途という前提で、Neonのブランチ分割による運用の手間よりも「常に1つの実データで動く」ことを優先した。トレードオフとして、ローカルで動作確認すると**そのデータが本番の`/admin`やアーカイブにも表示される**。気になってきたら、Neonのブランチ機能でいつでも後から分離できる。

---

## 1. Vercelプロジェクトの設定
- Vercel → Import Project → GitHub `shinonome-inc/web-dev-zemi`
- **Settings → Environments → Production Branch を `dev` に変更**（デフォルトの `main` のままだとNext.jsが検出されずビルド失敗する）

## 2. 環境変数（Settings → Environment Variables、Production向け）
| キー | 値 |
| --- | --- |
| `DATABASE_URL` | Neonの接続文字列（Pooled connection推奨） |
| `AUTH_SECRET` | `openssl rand -base64 32` などで生成 |
| `TOKEN_ENC_KEY` | Mastodon(PGrit)アクセストークンの暗号化キー（`openssl rand -base64 32`）。**ローカルの `.env.local` と同じ値にする**（共用DBのため。別物にすると保存済みトークンが復号できず全員再ログインが必要になる） |
| `AUTH_URL` | 本番URL（例 `https://web-dev-zemi.vercel.app` や独自ドメイン） |
| `AUTH_TRUST_HOST` | `true` |
| `MASTODON_INSTANCE` | `https://community.4nonome.com` |
| `MASTODON_CLIENT_ID` / `MASTODON_CLIENT_SECRET` | PGritのOAuthアプリの値（スコープに `read:accounts write:statuses` を含める） |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | （任意） |

## 3. PGrit（Mastodon）のリダイレクトURIを追加
community.4nonome.com → 設定 → 開発 → 該当アプリのリダイレクトURIに、本番URLのコールバックを追加（複数行可）:
```
https://<本番ドメイン>/api/auth/callback/mastodon
```
ローカル用 `http://localhost:3000/api/auth/callback/mastodon` は残す。

## 4. デプロイのトリガー
`dev` に push すれば自動デプロイされる。Production Branch変更直後など、手動で今すぐ反映したい場合は空コミットでも良い:
```bash
git checkout dev && git commit --allow-empty -m "chore: 🔧 Vercelの本番デプロイをトリガー" && git push
```

## 5. DBマイグレーション
開発と本番でDBを共用しているため、`pnpm db:migrate`（`.env.local` のDATABASE_URLに対して実行）が**そのまま本番にも反映される**。DBを分離した場合は、本番用の `DATABASE_URL` を指定して別途実行する。

## 6. 初期staffの設定
DBが共用のため、開発中に自分を `staff` にしていれば**そのまま本番でも staff**。未設定なら Neonコンソール（SQL Editor）か `pnpm db:studio` で:
```sql
update users set role='staff' where mastodon_acct='<自分のacct>@community.4nonome.com';
```

## 7. （任意）独自ドメイン
- Vercel → Settings → Domains でドメイン追加、表示されるDNSレコードを設定。
- `AUTH_URL` を独自ドメインに更新。
- PGrit（Mastodon）のリダイレクトURIに `https://<独自ドメイン>/api/auth/callback/mastodon` を追加。

---

## デプロイ後チェックリスト
- [ ] トップ（個人ダッシュボード）/ `/curriculum` が表示される
- [ ] PGrit（Mastodon）ログインが成功（リダイレクトURI一致）
- [ ] 進捗チェックが保存される
- [ ] `/admin` がstaffで表示、非staffで404
- [ ] ゼミ会の作成・出席・アーカイブ閲覧・コメント・PGrit自動投稿
