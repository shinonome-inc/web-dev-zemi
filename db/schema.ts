import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** 受講生 / 運営・講師 / 修了サポーター */
export const userRole = pgEnum("user_role", ["student", "staff", "graduate"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** 'mastodon' | 'google' */
    provider: text("provider").notNull(),
    /** プロバイダ側のユーザID */
    providerUid: text("provider_uid").notNull(),
    /** Mastodonのアカウント識別子（例: user@instance）*/
    mastodonAcct: text("mastodon_acct"),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    email: text("email"),
    role: userRole("role").notNull().default("student"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** ログイン/訪問で更新（アクティブ検知用）*/
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** 非表示（アーカイブ）日時。null=表示中。脱落・除名時に設定する */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [unique("users_provider_uid_unique").on(t.provider, t.providerUid)],
);

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 進捗項目ID（例: '01-ai-driven-dev-basics:c0'）*/
    itemId: text("item_id").notNull(),
    /** 集計の高速化用 */
    weekSlug: text("week_slug").notNull(),
    /** 行の存在＝完了 */
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("progress_user_item_unique").on(t.userId, t.itemId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Progress = typeof progress.$inferSelect;
