# 開発ワークフロー

このドキュメントは、レシートリワードシステムの開発フロー、ブランチ戦略、PR作成手順をまとめたものです。

---

## 目次

1. [ブランチ戦略](#ブランチ戦略)
2. [開発フロー](#開発フロー)
3. [ローカル開発環境](#ローカル開発環境)
4. [コミットメッセージ規約](#コミットメッセージ規約)
5. [PR作成手順](#pr作成手順)
6. [コードレビュー観点](#コードレビュー観点)

---

## ブランチ戦略

**GitHub Flow を採用**

シンプルで高速なリリースサイクルを実現するため、GitHub Flowを採用します。

### ブランチ構成

| ブランチ | 用途 | デプロイ先 |
|---------|------|-----------|
| `main` | 常にデプロイ可能な状態を保つ | Production/Staging（タグで制御） |
| `feature/*` | 機能開発・バグ修正 | ローカル環境のみ |

**重要:**
- `main` ブランチは常にデプロイ可能な状態を保つ
- `develop` ブランチは使用しない
- リリースはタグで管理（`v1.0.0`, `v1.0.1` 等）

### デプロイフロー

```
feature/* → main → Production（タグ: v1.0.0）
                 ↘ Staging（自動デプロイ）
```

1. **Staging**: `main` へのマージで自動デプロイ
2. **Production**: タグ作成（`v1.0.0`）でデプロイ

### ブランチ命名規則

```bash
# 機能開発
feature/issue-番号-機能名
例: feature/6522-db-migration

# バグ修正
fix/issue-番号-バグ内容
例: fix/123-webhook-duplicate-error

# リファクタリング
refactor/対象箇所
例: refactor/webhook-usecase

# ドキュメント
docs/ドキュメント名
例: docs/api-spec
```

**Note:** hotfixブランチは作らず、緊急時も `feature/*` または `fix/*` から `main` へマージ。

---

## 開発フロー

### 1. Issue確認

GitHub Projects（https://github.com/orgs/Connehito/projects/50）から担当するIssueを選択。

```bash
# Issueの詳細を確認
gh issue view 6522 --repo Connehito/mamari-spec
```

### 2. ブランチ作成

```bash
# mainから最新を取得
git checkout main
git pull origin main

# 機能ブランチを作成
git checkout -b feature/6522-db-migration
```

### 3. 開発

#### ローカル環境起動

```bash
# 全サービス起動
docker compose up -d

# ログ確認
docker compose logs -f api

# 特定サービスのみ起動
docker compose up -d api
pnpm dev:web  # Webはホストで直接起動も可
```

#### 開発サイクル

1. **コード修正**
2. **ローカルテスト**
   ```bash
   # ユニットテスト
   pnpm --filter api test

   # ウォッチモード
   pnpm --filter api test --watch

   # カバレッジ
   pnpm --filter api test --coverage
   ```
3. **Lint/Format**
   ```bash
   pnpm lint
   pnpm format
   ```
4. **動作確認**
   - API: http://localhost:3001
   - Web: http://localhost:3000
   - Health: http://localhost:3001/health

### 4. コミット

コミットメッセージ規約に従ってコミット（後述）。

```bash
git add .
git commit -m "feat: Webhook受信APIを実装"
```

### 5. Push & PR作成

```bash
git push origin feature/6522-db-migration

# PR作成
gh pr create --title "feat: Webhook受信APIを実装" \
  --body "Closes #6522

## 変更内容
- Webhook受信エンドポイントを実装
- JWE復号化処理を追加
- べき等性チェックを実装

## テスト
- [ ] ユニットテスト追加
- [ ] 統合テスト追加
- [ ] 手動動作確認完了

## 関連Issue
#6522"
```

---

## ローカル開発環境

### 環境変数設定

初回のみ `.env` ファイルを作成：

```bash
cp .env.example .env
vi .env  # DATABASE_PASSWORDなど必要な値を設定
```

### 依存関係インストール

```bash
pnpm install
```

### Docker起動

```bash
# 初回ビルド
docker compose up --build -d

# 2回目以降
docker compose up -d

# 停止
docker compose down

# 完全クリーンアップ
docker compose down -v  # ボリュームも削除
```

### トラブルシューティング

詳細は [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照。

**よくある問題:**

- **APIが起動しない**: `docker compose restart api`
- **ポート競合**: `lsof -i :3001` で確認
- **DBマイグレーション未適用**: mamari-dbリポジトリで適用

---

## コミットメッセージ規約

### フォーマット

```
<type>: <subject>

<body>

<footer>
```

### Type一覧

| Type | 用途 | 例 |
|------|------|-----|
| `feat` | 新機能追加 | `feat: Webhook受信APIを実装` |
| `fix` | バグ修正 | `fix: べき等性チェックのバグを修正` |
| `refactor` | リファクタリング | `refactor: UseCaseのトランザクション処理を改善` |
| `docs` | ドキュメント | `docs: API仕様書を更新` |
| `test` | テスト追加・修正 | `test: Webhookのユニットテストを追加` |
| `chore` | 雑務（ビルド、依存関係等） | `chore: pnpm dependenciesを更新` |
| `style` | コードスタイル修正 | `style: Prettierでフォーマット` |
| `perf` | パフォーマンス改善 | `perf: コイン残高取得クエリを最適化` |

### 例

```bash
git commit -m "feat: Webhook受信APIを実装

- JWE復号化処理を追加
- media_cashback_idのUNIQUE制約でべき等性を保証
- トランザクション内で3テーブルを更新

Closes #6522

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### ルール

- **日本語で記述**（識別子は英語）
- **1行目は50文字以内**
- **本文は72文字で改行**
- **`Co-Authored-By`** を付与（Claude Codeで開発時）

---

## PR作成手順

### PR作成前チェックリスト

- [ ] テストが通る（`pnpm test`）
- [ ] Lintエラーなし（`pnpm lint`）
- [ ] ローカルで動作確認完了
- [ ] DATABASE.mdとの整合性確認（DB変更時）
- [ ] ARCHITECTURE.mdの更新（アーキテクチャ変更時）
- [ ] コミットメッセージが規約準拠

### PRテンプレート

```markdown
## 変更内容

簡潔に変更内容を記述。

## 変更理由

なぜこの変更が必要なのか。

## テスト

- [ ] ユニットテスト追加
- [ ] 統合テスト追加
- [ ] E2Eテスト追加（必要な場合）
- [ ] 手動動作確認完了

## スクリーンショット（UI変更時）

（必要に応じて）

## 関連Issue

Closes #<issue番号>

## レビュー観点

レビュアーに特に見てほしいポイントを記載。

## デプロイ時の注意事項

- DBマイグレーションが必要
- 環境変数の追加が必要
- など
```

### PRマージ基準

- ✅ 1名以上のApprove取得
- ✅ CI/CDパイプライン成功
- ✅ コードレビュー指摘事項解消
- ✅ コンフリクト解消済み

---

## コードレビュー観点

### レビュアーが確認すること

#### 機能面

- [ ] Issueで指定された要件を満たしているか
- [ ] エッジケース・異常系の考慮があるか
- [ ] セキュリティ上の問題はないか（SQLインジェクション、XSS等）

#### 設計面

- [ ] Clean Architectureに準拠しているか
- [ ] Domain層にフレームワーク依存がないか
- [ ] Repositoryパターンが適切に使われているか
- [ ] トランザクション境界が適切か

#### コード品質

- [ ] CLAUDE.mdのコーディング規約に準拠しているか
- [ ] 命名が適切か（英語、camelCase等）
- [ ] コメントが日本語で記述されているか
- [ ] `any` 型が使われていないか
- [ ] 不要なconsole.logが残っていないか

#### テスト

- [ ] ユニットテストが追加されているか
- [ ] テストカバレッジが適切か（最低70%）
- [ ] エッジケースのテストがあるか

#### ドキュメント

- [ ] API仕様書が更新されているか（API変更時）
- [ ] DATABASE.mdが更新されているか（DB変更時）
- [ ] README/CLAUDE.mdの更新が必要か

---

## 環境別設定

### 開発環境（ローカル）

- **DB**: mamari-mysql コンテナ
- **Redis**: local-mamari-redis コンテナ
- **PMN API**: モック使用（`MOCK_PMN_API=true`）
- **ログレベル**: `debug`

### ステージング環境

- **DB**: RDS（develop環境）
- **Redis**: ElastiCache
- **PMN API**: WED社Sandbox環境
- **ログレベル**: `info`

### 本番環境

- **DB**: RDS（production環境）
- **Redis**: ElastiCache
- **PMN API**: WED社本番環境
- **ログレベル**: `warn`

---

## 参考リンク

- [CLAUDE.md](./CLAUDE.md) - コーディング規約
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計
- [DATABASE.md](./DATABASE.md) - データベース設計
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - エラーハンドリング
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティング
- [GitHub Projects](https://github.com/orgs/Connehito/projects/50) - タスク管理

---

**最終更新日**: 2026-02-16
