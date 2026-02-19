# レシトク（reci-toku）- ローカル開発環境

pnpm、Turborepo、Nest.js、React (Vite)を使用したレシートリワードシステムのモノリポ構成です。

**プロジェクト管理**: https://github.com/orgs/Connehito/projects/50

## 前提条件

- Node.js 20.x（推奨: nvm使用）
- pnpm 8.15.0+
- Docker & Docker Compose
- MySQLとRedisのコンテナ（`mamari_link`ネットワーク上）

## プロジェクト構成

```
reci-toku/
├── apps/
│   ├── api/          # Nest.js API（ポート: 3001）
│   └── web/          # React + Vite SPA（ポート: 3000）
├── packages/
│   ├── config/       # 共通TypeScript設定
│   └── shared/       # 共通ユーティリティ（プレースホルダー）
└── docker-compose.yml
```

## セットアップ手順

### 1. データベースコンテナのセットアップ

このプロジェクトは既存のMySQL/Redisコンテナを使用します。
まず、DBコンテナを起動してください：

```bash
# mamari-dbリポジトリをクローン（まだの場合）
git clone https://github.com/Connehito/mamari-db.git

# DBコンテナの起動方法は以下を参照
# https://github.com/Connehito/mamari-db/blob/main/README.md
```

必要なコンテナ：
- `mamari-mysql`（MySQL 8.0）
- `local-mamari-redis`（Redis 7）
- `mamari_link`ネットワーク

コンテナが起動していることを確認：
```bash
docker ps | grep -E "mamari-mysql|local-mamari-redis"
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、データベースパスワードを設定します：

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してDATABASE_PASSWORDを設定
# DATABASE_PASSWORD=your_actual_password
```

**Docker Compose環境の利点:**
- コンテナ間通信は内部ポート（3306）を直接使用
- ポートマッピング（3307）を意識する必要なし
- `DATABASE_HOST=mamari-mysql`（Dockerホスト名）で接続

**重要**: `.env`ファイルはGit管理外です（`.gitignore`済み）。パスワードなどの機密情報は安全に管理されます。

### 3. Node.js環境のセットアップ

```bash
# Node.js 20を使用
nvm use

# pnpmをインストール（まだの場合）
npm install -g pnpm@8.15.0

# 依存関係をインストール
pnpm install

# Git Hooksをセットアップ（センシティブ情報チェック）
./scripts/setup-hooks.sh
```

**Git Hooksについて**:
- コミット前に自動的にセンシティブ情報（APIキー、パスワード、秘密鍵など）をチェックします
- 問題が検出された場合、コミットが中止されます
- 詳細: `scripts/pre-commit` を参照

### 4. 開発環境の起動

```bash
# Dockerコンテナを起動（初回はビルドも実行）
docker compose up --build

# バックグラウンドで起動する場合
docker compose up -d --build
```

### 5. 動作確認

ブラウザで以下のURLにアクセス：

- **フロントエンド**: http://localhost:3000
- **API**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

正常に起動すると：
- フロントエンド: React SPAのホーム画面が表示される
- API: "Hello World from Nest.js API!" が表示される
- ヘルスチェック: `{"status":"ok","timestamp":"..."}` が返される

## 開発方法

### コンテナでの開発

```bash
# コンテナを起動（ホットリロード有効）
docker compose up

# ログを確認
docker compose logs -f

# コンテナを停止
docker compose down

# コンテナを再ビルド
docker compose up --build
```

### ローカルでの開発（コンテナなし）

```bash
# すべてのアプリを起動
pnpm dev

# APIのみ起動
pnpm dev:api

# Webのみ起動
pnpm dev:web

# ビルド
pnpm build
```

### ホットリロード

ファイルを編集すると自動的に反映されます：
- `apps/api/src/main.ts` → APIが自動再起動
- `apps/web/src/pages/Home.tsx` → ブラウザが自動更新（Vite HMR）

## トラブルシューティング

### DBコンテナに接続できない

```bash
# mamari_linkネットワークが存在するか確認
docker network ls | grep mamari_link

# MySQLコンテナが起動しているか確認
docker ps | grep mamari-mysql

# Redisコンテナが起動しているか確認
docker ps | grep local-mamari-redis
```

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001

# 既存のコンテナを停止
docker compose down
```

### 依存関係のエラー

```bash
# node_modulesとlock fileを削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Dockerビルドエラー

```bash
# Dockerキャッシュをクリアして再ビルド
docker compose build --no-cache
docker compose up
```

## 備考

- これは最小限の「Hello World」セットアップです
- ビジネスロジックは実装されていません
- 既存の`mamari-mysql`と`local-mamari-redis`コンテナを使用します
- APIとWebの両方でホットリロードが有効です

## 技術スタック

- **モノリポ**: Turborepo 1.x + pnpm workspaces
- **バックエンド**: Nest.js 10.x（TypeScript）+ TypeORM
- **フロントエンド**: React 18.x + Vite（SPA、TypeScript）
- **データベース**: MySQL 8.0（mamariq DB、マイグレーションはRidgepole管理）
- **キャッシュ**: Redis 7
- **コンテナ**: Docker & Docker Compose

**技術選定理由**: [ADR - 技術スタック選定](https://github.com/Connehito/mamari-spec/issues/6461)
