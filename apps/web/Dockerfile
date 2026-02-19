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

# Viteビルド
RUN pnpm turbo run build --filter=web

# Stage 4: Runner (Nginx)
FROM nginx:alpine AS runner

# 非rootユーザーで実行（セキュリティ）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 webuser

# ビルド成果物をNginxの公開ディレクトリにコピー
COPY --from=builder --chown=webuser:nodejs /app/apps/web/dist /usr/share/nginx/html

# Nginx設定ファイルをコピー（必要に応じて作成）
# COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
