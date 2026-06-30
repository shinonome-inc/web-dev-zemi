# 本番デプロイ手順（DigitalOcean App Platform）

ポータルを DigitalOcean App Platform に Docker でデプロイする手順。DBは Neon（本番ブランチ）、認証は Auth.js（Mastodon / Google）。

> デプロイ対象ブランチは **`dev`**（ポータル本体の統合先）。`main` は現状のMarkdownビューアのまま。

## 構成
- アプリ: Next.js（standalone）を `Dockerfile` でビルド → App Platform で実行
- DB: Neon（本番ブランチ）。`DATABASE_URL` を App Platform の環境変数に設定
- リージョン: `sgp`（シンガポール。Neonも同リージョン推奨）
- インスタンス: `basic-xxs`（最小・約$5/月）

---

## 1. Neon に本番ブランチを用意
1. Neon のプロジェクトで **Branches → 本番用ブランチ**（例: `production`）を作成（dev用と分離）。
2. その **Pooled connection** の接続文字列を控える（`...-pooler...?sslmode=require`）。

## 2. Mastodon の本番リダイレクトURIを追加
既存のOAuthアプリ（`community.4nonome.com` の設定→開発）に、本番URLのコールバックを追加（複数可・改行区切り）:
```
https://<本番ドメイン>/api/auth/callback/mastodon
```
ローカル用 `http://localhost:3000/api/auth/callback/mastodon` は残してOK。スコープは `read:accounts`。
（Googleを使う場合も同様に承認済みリダイレクトURIへ本番URLを追加）

## 3. App Platform でアプリ作成
GUI（Apps → Create App）または `doctl apps create --spec .do/app.yaml`。
- ソース: GitHub `shinonome-inc/web-dev-zemi`、ブランチ `dev`、`deploy_on_push: true`
- ビルド: **Dockerfile**（自動検出。`http_port` は 3000）
- リージョン: `sgp` / インスタンス: `basic-xxs`

> **組織repoの接続について**: App Platform は GitHub App 経由で連携します。組織private repo の場合、**組織オーナーによる DigitalOcean GitHub App のインストール承認**が必要なことがあります（Vercelで遭遇したのと同種）。承認が難しい場合は §7 のコンテナレジストリ経由を使う。

## 4. 環境変数を設定（ダッシュボード / Settings → App-Level or Component env）
| キー | 値 | 種別 |
| --- | --- | --- |
| `DATABASE_URL` | Neon本番のPooled接続文字列 | SECRET |
| `AUTH_SECRET` | `pnpm dlx auth secret` 等で**新規生成**（ローカルと別物） | SECRET |
| `TOKEN_ENC_KEY` | Mastodonトークン暗号化キー（`openssl rand -base64 32`）。**ローカルとは別物を生成** | SECRET |
| `AUTH_URL` | `https://<本番ドメイン>` | 通常 |
| `AUTH_TRUST_HOST` | `true` | 通常 |
| `MASTODON_INSTANCE` | `https://community.4nonome.com` | 通常 |
| `MASTODON_CLIENT_ID` / `MASTODON_CLIENT_SECRET` | 本番OAuthアプリの値（スコープに `write:statuses` を含める） | SECRET |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | （任意） | SECRET |

> `AUTH_URL` はデプロイ後に確定するドメイン（`*.ondigitalocean.app` か独自ドメイン）。確定後に設定し再デプロイ。

## 5. DBマイグレーションを本番に適用
本番DBに対して**手元から1回**実行（スキーマ変更のたびに実施）:
```bash
DATABASE_URL='<Neon本番のPooled接続文字列>' pnpm db:migrate
```
> 30人規模・変更頻度低のため手動運用で十分。将来は pre-deploy ジョブ化も可能。

## 6. 初期staffの設定
本番DBにユーザーがまだいないので、まず自分がログイン（ユーザー行が作られる）→ Neon本番コンソール / `pnpm db:studio`（本番URL指定）で自分の `role` を `staff` に変更 → 再ログインで「管理」表示。

## 7. （代替）組織GitHub App承認が難しい場合：コンテナレジストリ経由
1. DigitalOcean Container Registry を作成。
2. ローカルでイメージをビルドして push:
   ```bash
   doctl registry login
   docker build -t registry.digitalocean.com/<registry>/portal:latest .
   docker push registry.digitalocean.com/<registry>/portal:latest
   ```
3. App Platform でソースを **DOCR イメージ** にして作成（GitHub App 不要）。env は §4 と同じ。

## 8. （任意）独自ドメイン
- Namecheap（GitHub Student Pack で `.me` 無料1年）等でドメイン取得。
- App Platform → Settings → Domains で追加し、表示される DNS（CNAME / A）を設定。
- `AUTH_URL` とMastodonのリダイレクトURIを独自ドメインに更新して再デプロイ。

---

## デプロイ後チェックリスト
- [ ] トップ / `/curriculum` が表示される
- [ ] Mastodonログインが成功（本番リダイレクトURI一致）
- [ ] 進捗チェックが保存される（本番DBに反映）
- [ ] `/admin` がstaffで表示、非staffで404
- [ ] ゼミ会の作成・出席・アーカイブ閲覧・コメント
- [ ] Billing Alert（$20/$50）設定済み・GPU等を使っていない
