# Stage 1: Base
FROM node:20-alpine AS base
RUN npm install -g pnpm@8.15.0
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter=web...

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY turbo.json ./
COPY apps/web ./apps/web

# Next.jsテレメトリーを無効化
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm turbo run build --filter=web

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非rootユーザーで実行（セキュリティ）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs

# Next.js standaloneビルドをコピー
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
