# はじめてのWEB開発ゼミ ポータルサイト 技術計画

> このドキュメントは要件（背景・目的・機能要件）をもとにした技術設計の計画書です。
> 前提条件は運営ヒアリング結果を反映しています。

## 0. 前提条件（確定事項）

| 項目 | 内容 |
| ---- | ---- |
| 規模 | 受講生 のべ約15人、想定同時利用 〜30人程度 |
| 稼働期間 | 最低6ヶ月（1期分） |
| インフラ予算 | GitHub Education / Student Developer Pack の無料枠・配布クレジットでまかなう |
| Mastodon認証 | 既存インスタンスにOAuthアプリを登録できる管理権限あり → **Mastodonログインを主軸に実装** |
| Discord連携 | 初期は **対応スレッドへのリンク＋案内文言のみ**（内容取り込みは後続フェーズ） |

この規模では大規模な作り込みは不要です。**無料枠だけで6ヶ月稼働でき、配布クレジットは温存できる**構成を基本方針とします。

---

## 1. 全体アーキテクチャ

```
[受講生/運営] ── ブラウザ
      │
      ▼
┌──────────────────────────────┐
│  Next.js (App Router)  on Vercel (Hobby/無料)        │
│  ├ カリキュラム表示（curriculum/ のMarkdownを描画）  │
│  ├ 進捗チェックUI（要ログイン）                       │
│  ├ 運営ダッシュボード（/admin・staffのみ）           │
│  └ Auth.js（PGrit=Mastodon OAuth 主／Google 従）     │
└──────────────────────────────┘
      │ SQL
      ▼
┌──────────────────────────────┐
│  Postgres（Neon 無料枠）                             │
│  users / progress / meetings / meeting_attendance /  │
│  meeting_comments                                    │
└──────────────────────────────┘
      │ OAuth
      ▼
[ コミュニティMastodon(PGrit)インスタンス ] / [ Google ]

[ Discord ] ← 各課題ページからリンク（未実装・今後の課題）
```

### 設計の基本思想
- **カリキュラムMarkdownを「コンテンツの正」として維持する**（Notion/GitHub運用の延長・ゼミの「ドキュメント駆動」テーマとも一致）。ポータルはそれを描画し、各チェック項目に進捗を紐づける。
- **受講生が学ぶ技術スタックでポータル自身を作る**（Next.js + DB）。ポータルのソース自体が生きた教材になる。
- 30人規模・6ヶ月という身の丈に合わせ、**MVPを最短で出して運用しながら育てる**。

---

## 2. 技術スタック（推奨と理由）

| レイヤ | 推奨 | 理由 / 代替 |
| ------ | ---- | ---------- |
| フレームワーク | **Next.js（App Router, TypeScript）** | カリキュラム5週目・中間課題で扱う技術と一致。SSRでMarkdownもAPIも1つで完結。代替: Remix |
| ホスティング | **Vercel（Hobby・無料）** | リポジトリを**public化**したことでHobbyがそのまま使える。GitHub push（`dev`ブランチ）で自動デプロイ |
| 認証 | **Auth.js (NextAuth v5)** | PGrit(Mastodon, OAuth2)のカスタムプロバイダ＋Google を共存可能。セッション管理込み |
| DB | **Postgres（Neon 無料枠）** | サーバーレス・ゼロスケールで無料。開発/本番を**単一DBで共用**（30人規模の運用負荷軽減を優先） |
| ORM | **Drizzle ORM** | 軽量・型安全。代替: Prisma（DXが手厚く初学者向け） |
| Markdown描画 | **react-markdown + remark-gfm** | GFMのタスクリスト（`- [ ]`）抽出・描画に使用 |
| トークン暗号化 | **AES-256-GCM（Node crypto）** | PGritのアクセストークンをDB保存時に暗号化。鍵(`TOKEN_ENC_KEY`)はDBと別管理 |

> **デプロイ先の決定経緯**: 当初Vercel Hobby（無料）を想定したが、組織所有のprivate repoはVercel HobbyだとPro必須で不可と判明。次にDigitalOcean App Platform（GitHub Student Packの$200クレジット）に切り替えたが、クレジットの有効期限が想定より短く実質1ヶ月ほどしか残っていなかったため断念。最終的に**リポジトリをpublic化**し、Vercel Hobby（$0）に確定。DBはNeon無料枠のまま変更なし。学習コミュニティのポータルという性質上、コード公開自体はデメリットにならない。
>
> DigitalOcean向けに用意した `Dockerfile` / `.do/app.yaml` / GitHub Actions等は不要になったため削除済み。当時のコスト試算・GPU注意点等の詳細は、必要であれば `git log` の該当コミット時点の本ファイルを参照。

---

## 3. カリキュラム & 進捗のデータ化

### 3.1 コンテンツの扱い
- `curriculum/*.md` をそのままコンテンツソースにする（移動しない）。
- ビルド時に各ファイルを解析し、**進捗項目マニフェスト**を生成する。
- 現状、全11ファイルに **計35個** のタスクリスト項目（`- [ ]`）があり、これを進捗の最小単位とする。
  - 各週: `## 自己チェックリスト` の項目（3〜4個）
  - 中間課題: `## 成果物の要件` の項目（3個）
  - → 「ファイル内のGFMタスクリスト項目すべてをその週の進捗項目とする」というシンプルな規約に統一。

### 3.2 進捗項目の安定ID
チェック状態をDBに保存するには、項目ごとに**安定したID**が必要。

- ID 規約: `<週スラッグ>:c<連番>`（例: `01-ai-driven-dev-basics:c0`）
- ビルド時に `curriculum.manifest.json` を生成:
  ```json
  {
    "01-ai-driven-dev-basics": {
      "title": "1週目：AI駆動開発の基本操作",
      "order": 1,
      "items": [
        { "id": "01-ai-driven-dev-basics:c0", "text": "AIコーディング支援ツールを起動し…" },
        ...
      ]
    }
  }
  ```
- **運用ルール**: チェック項目は原則 *追記* で運用し、既存項目の並び替え・削除は避ける（連番IDがズレ、保存済み進捗と乖離するため）。やむを得ず変更する場合は移行メモを残す。
  - より頑健にしたい場合の代替: ID を `週スラッグ:項目テキストのhash先頭8桁` にする（並び替えに強いが、文言修正に弱い）。30人規模では連番＋追記運用で十分。

### 3.3 進捗の粒度
- 保存単位: **チェック項目単位**（受講生がページ上の各チェックボックスをON/OFF）。
- 派生指標: 週ごとの完了率、全体の完了率を集計時に算出。
- 受講生ビュー: 各週ページにチェックボックス、トップに全体進捗バー。

---

## 4. データモデル（Postgres）

```
users
  id              uuid (PK)
  provider        text         -- 'mastodon' | 'google'
  provider_uid    text         -- プロバイダ側のユーザID
  mastodon_acct   text  null   -- 例: @user@instance
  display_name    text
  avatar_url      text  null
  email           text  null
  role            text         -- 'student' | 'staff' | 'graduate'  (default 'student')
  created_at      timestamptz
  last_seen_at    timestamptz  -- ログイン/訪問で更新（アクティブ検知用）
  unique(provider, provider_uid)

progress
  id            uuid (PK)
  user_id       uuid (FK users)
  item_id       text          -- 例: '01-ai-driven-dev-basics:c0'
  week_slug     text          -- 集計の高速化用
  completed_at  timestamptz   -- 行の存在＝完了
  unique(user_id, item_id)

-- 後続フェーズ（Phase 2）で追加:
activity_log
  id           uuid (PK)
  user_id      uuid (FK users)
  type         text          -- 'login' | 'progress' | 'weekly_report' | 'mastodon_post' | ...
  occurred_at  timestamptz
  meta         jsonb null
```

- Auth.js を DBセッションで使う場合は `accounts` / `sessions` テーブルも追加（アダプタが自動生成）。MVPは **JWTセッション + 上記 users 自前管理** でも可。
- 個人情報は最小限（表示名・アバター・必要時のみメール）。Supabase採用時は RLS で users/progress を本人＋staffに限定。

---

## 5. 認証（Mastodon 主 / Google 従）

管理権限があるため、Mastodonログインを主軸に実装する。

### 5.1 事前準備（運営作業・1回のみ）
1. コミュニティのMastodonインスタンスで **開発 → 新規アプリ** を作成（または `/api/v1/apps` で登録）。
2. 必要スコープ: `read:accounts write:statuses`（プロフィール取得＋PGrit自動投稿。実装済み）。
3. リダイレクトURI: `https://<本番ドメイン>/api/auth/callback/mastodon`。
4. 発行された **client_id / client_secret / インスタンスURL** を Vercel の環境変数（Production）に登録。

### 5.2 実装
- Auth.js に **Mastodonカスタムプロバイダ**（OAuth2: `/oauth/authorize` → `/oauth/token` → `/api/v1/accounts/verify_credentials`）を定義。
- 取得情報を `users` にupsert（`mastodon_acct`, `display_name`, `avatar_url`）。
- **Google プロバイダ**を従として併設（Mastodonで詰まる人向けのフォールバック）。同一人物が両方でログインした場合の名寄せは、当面は別アカウント扱いで運用回避（30人規模なので手動マージで足りる）。
- ログイン/主要ページ訪問時に `last_seen_at` を更新。

### 5.3 ロール
- `student`（既定） / `staff`（運営・講師） / `graduate`（修了サポーター）。
- staff への昇格は手動（最初の運営アカウントを環境変数のメール/acctで初期staff指定）。
- `graduate`: 全項目完了で自動的に「修了」表示 → サポーターロール付与は当面 staff が手動承認（将来自動化）。

---

## 6. Discord連携（初期＝リンク＋案内文言のみ）

- 週 → 質問スレッドURL の対応表を持つ（`curriculum/*.md` のフロントマター `discord_thread:` か、`config/discord-threads.json`）。
- 各課題ページに:
  - 「Discordで質問する」ボタン（対応スレッドへ）。
  - 案内文: 「わからないことは、まずDiscordのスレッドに同じ質問がないか確認してください。解決しなければ週1回のゼミ会で質問しましょう。」
- これだけで機能要件4の代替要件を満たす。**スレッド内容の取り込み（Bot）は Phase 3** に回す。

---

## 7. 運営ダッシュボード & 非アクティブ検知

### 7.1 ダッシュボード（`/admin`・staffのみ、サーバ側でロール検査）
- 受講生一覧テーブル: 表示名 / 全体完了率 / 週ごとの進捗 / 最終進捗日 / 最終ログイン / 非アクティブフラグ。
- 週別の達成状況サマリ（どの週で詰まりが多いか）。
- **CSVエクスポート**（集計・名簿照合用）。

### 7.2 非アクティブ検知（MVP）
- 指標: `最終進捗日 = max(progress.completed_at)` と `last_seen_at`。
- ルール例: いずれも **直近N日（既定14日、設定可）更新なし → 「要フォロー」フラグ**（黄=7日, 赤=14日 など段階表示）。
- これは脱落防止・除名判断の「ヒント」であり、最終判断は運営が行う旨を画面に明記。

### 7.3 検知材料の拡張（Phase 2）
- `activity_log` に「週報投稿」「PGrit週1ポスト」「ゼミ会参加」などの活動を蓄積。
  - Mastodon: 完了報告/週ポストを Mastodon API で取得して記録。
  - Discord: 週報投稿を Bot/Webhook で検知して記録。
- 複数シグナルを合算した、より正確なアクティブ判定へ。

---

## 8. 段階的な開発計画

### Phase 0｜基盤（〜1週）
- Next.js + TypeScript プロジェクト作成、Vercelへデプロイ、DB（Neon）接続。
- Auth.js で PGrit(Mastodon) + Google ログイン。`users` upsert と `last_seen_at`。

### Phase 1｜MVP（コア機能）
- `curriculum/*.md` の描画（一覧 → 週ページ、順番に閲覧）。
- ビルド時マニフェスト生成、チェック項目単位の進捗保存（要ログイン）、進捗バー。
- Discordリンク＋案内文言。
- `/admin` ダッシュボード（一覧・週別サマリ・非アクティブフラグ・CSV）。
- → **ここで要件1〜4の必須部分をすべて充足。**

### Phase 2｜活動連携と検知強化
- `activity_log` 追加。Mastodon投稿 / Discord週報 を取り込み、非アクティブ検知を多シグナル化。
- 完了時に Mastodon へ完了報告を投稿する導線（共有intent or `write:statuses`）。
- `graduate`（修了サポーター）ロールの判定・付与フロー。

### Phase 3｜発展（任意）
- Discordスレッド内容のポータル表示（Bot）。
- 通知（ステール受講生への自動リマインド等）。

---

## 9. リポジトリ構成（案）

```
web-dev-zemi/
├ curriculum/            # 既存。コンテンツの正（移動しない）
├ docs/                  # 本計画書など
├ app/                   # Next.js App Router
│  ├ (public)/           # カリキュラム閲覧
│  ├ admin/              # 運営ダッシュボード
│  └ api/auth/…          # Auth.js
├ lib/                   # markdown解析・マニフェスト生成・DBアクセス
├ db/                    # Drizzleスキーマ/マイグレーション
└ config/                # discord-threads.json など
```
- 単一Next.jsアプリがビルド時に `curriculum/` を読む構成。モノレポ不要。

---

## 10. 主なリスク・留意点

- **進捗項目IDの安定性**: §3.2 の追記運用ルールを守る。崩れると進捗とのズレが発生。
- **Markdown規約の統一**: 進捗にしたいチェックボックスの置き場所（自己チェックリスト/成果物の要件）を規約化し、解析側と合わせる。
- **アカウント名寄せ**: Mastodon/Google二重ログイン者の重複。30人規模は手動マージで対応、必要なら後でメール突合。
- **クレジット管理**: §2.1の通りBilling Alert設定とGPU回避を徹底。クレジット切れ後のカード課金、有効期限切れに注意。定期`pg_dump`でバックアップを用意。
- **プライバシー**: 進捗・活動は学習評価に使うため、受講生に「運営が進捗・活動状況を閲覧する」旨を明示（規約/初回同意）。
- **除名判断**: 非アクティブフラグはあくまで補助指標。自動除名はせず、運営の判断材料に留める設計とする。

---

## 11. 実装状況（2026-07-01時点）

Phase 0〜1の主要機能は実装・本番稼働済み。詳細な運用手順は [docs/deployment.md](deployment.md) を参照。

- [x] カリキュラム閲覧・進捗チェック（受講生）
- [x] PGrit(Mastodon) / Google ログイン
- [x] 運営ダッシュボード（進捗率・非アクティブ検知・ロール変更・アーカイブ・並べ替え）
- [x] ゼミ会（admin管理＋出席＋受講生アーカイブ＋コメント＋PGrit自動投稿）
- [x] 個人ダッシュボード（home）
- [x] 本番デプロイ（Vercel + Neon）

### 残タスク（次アクション）
1. Discordリンク＋案内文言（要件4の最小版。未着手）
2. 独自ドメイン（`.tech`, GitHub Student Pack）の設定
3. 修了/ゼミ幹部（`graduate`）ロールの運用整備（現状は手動変更のみ）
4. 受講生・卒業生向け「サイト改善プロジェクト」の整備（`CONTRIBUTING.md`・Issueテンプレ等）
5. 非アクティブ検知のシグナル強化（PGrit投稿頻度なども材料に）
6. テスト・CI整備
