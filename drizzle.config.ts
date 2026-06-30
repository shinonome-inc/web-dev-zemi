import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit は Next.js と別プロセスのため .env.local を明示的に読み込む
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
