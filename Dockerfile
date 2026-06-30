# syntax=docker/dockerfile:1

# ── base（pnpm を corepack で有効化）──────────────────────
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

# ── 依存インストール ──────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── ビルド ────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# ビルド時はDBに接続しない。モジュール読み込みを通すためのダミー値（実値は実行時にApp Platformが注入）。
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV AUTH_SECRET=build-time-dummy
RUN pnpm build

# ── 実行（Next.js standalone）─────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
