# Stage 1: Base
FROM node:20-alpine AS base
RUN npm install -g pnpm@8.15.0
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter=api...

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY turbo.json ./
COPY apps/api ./apps/api
RUN pnpm turbo run build --filter=api

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 非rootユーザーで実行（セキュリティ）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

USER nestjs

# ビルド成果物と必要な依存関係のみコピー
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
