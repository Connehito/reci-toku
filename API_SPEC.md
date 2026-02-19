# API仕様書

このドキュメントは、レシートリワードシステムのAPI仕様を定義したものです。

---

## 目次

1. [概要](#概要)
2. [認証](#認証)
3. [エンドポイント一覧](#エンドポイント一覧)
4. [共通仕様](#共通仕様)
5. [エラーレスポンス](#エラーレスポンス)

---

## 概要

### ベースURL

| 環境 | URL |
|------|-----|
| **開発** | `http://localhost:3001` |
| **ステージング** | `https://api-staging.mamari.jp/receipt-reward` |
| **本番** | `https://api.mamari.jp/receipt-reward` |

### API設計原則

- **RESTful API**
- **JSON形式**（Content-Type: application/json）
- **UTF-8エンコーディング**
- **ISO 8601形式のタイムスタンプ**（UTC）

---

## 認証

### 1. JWEトークン認証（PMN連携用）

Performance Media Network（WED/ONE）への遷移時に使用。

**方式:** JWE（JSON Web Encryption）
**アルゴリズム:** A256GCM

**詳細:** [ARCHITECTURE.md - JWE暗号化](./ARCHITECTURE.md#jwe暗号化復号化performance-media-network仕様)

### 2. セッション認証（内部API用）

ママリアプリからのAPI呼び出し時に使用。

**方式:** Cookie-based Session
**有効期限:** 24時間

---

## エンドポイント一覧

### 1. 認証・トークン生成

#### POST /api/auth/token

JWEトークンを生成し、PMN（WED/ONE）への遷移用トークンを返却。

**リクエスト:**

```json
{
  "userId": 12345
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `userId` | number | ✅ | ママリユーザーID |

**レスポンス（成功）:**

```json
{
  "jweToken": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoiY2xpZW50XzEyMzQ1In0...",
  "redirectUrl": "https://mamari.perf.media/?jwe=eyJhbGciOiJkaXIi...",
  "expiresIn": 3600
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `jweToken` | string | JWEトークン（ワンタイム） |
| `redirectUrl` | string | PMNへのリダイレクトURL |
| `expiresIn` | number | トークン有効期限（秒） |

**エラー:**

| ステータス | エラーコード | 説明 |
|-----------|-------------|------|
| 400 | `RR0701` | userIdが不正 |
| 404 | `RR0104` | ユーザーが存在しない |
| 500 | `RR0301` | JWE暗号化失敗 |

**cURLサンプル:**

```bash
curl -X POST http://localhost:3001/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": 12345}'
```

---

### 2. Webhook受信

#### POST /api/webhook

Performance Media Network（WED/ONE）からのWebhookを受信し、コイン付与処理を実行。

**リクエスト:**

```json
{
  "media_id": "media_123",
  "media_user_code": "user-uuid-xxx",
  "receipt_campaign_id": "319fd1f1-04d6-4943-8469-4dacbbb15a3a",
  "receipt_campaign_name": "P&G おむつキャンペーン",
  "receipt_campaign_image": "https://...",
  "company_name": "P&G",
  "company_id": "company_001",
  "service_type": "receipt",
  "participation_timestamp": "2026-02-16T06:00:00+09:00",
  "processed_timestamp": "2026-02-16T06:05:00+09:00",
  "incentive_points": 100,
  "media_cashback_id": "cb_xxx-xxx-xxx",
  "media_cashback_code": "oGtGV4JZC5qJByA"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `media_id` | string | ✅ | PMN発行のメディアID |
| `media_user_code` | string | ✅ | ママリのユーザーUUID |
| `receipt_campaign_id` | string | ✅ | PMN側キャンペーンUUID |
| `receipt_campaign_name` | string | ✅ | キャンペーン名 |
| `incentive_points` | number | ✅ | 付与コイン数 |
| `media_cashback_id` | string | ✅ | 取引ID（べき等性キー） |
| `media_cashback_code` | string | ✅ | 15桁コード |
| `service_type` | string | ✅ | `receipt` or `mission` |
| ... | ... | ... | その他フィールド |

**レスポンス（成功）:**

```json
{
  "status": "success",
  "message": "コインを付与しました",
  "data": {
    "userId": 12345,
    "coinsAdded": 100,
    "newBalance": 550
  }
}
```

**レスポンス（重複Webhook）:**

```json
{
  "status": "already_processed",
  "message": "このWebhookは既に処理済みです",
  "media_cashback_id": "cb_xxx-xxx-xxx"
}
```

**HTTPステータス:** 200 OK（リトライさせない）

**エラー:**

| ステータス | エラーコード | 説明 |
|-----------|-------------|------|
| 400 | `RR0102` | キャンペーン未登録 |
| 400 | `RR0103` | JWE復号化失敗 |
| 400 | `RR0104` | ユーザーが存在しない |
| 500 | `RR0105` | トランザクションエラー |

**べき等性保証:**

`media_cashback_id` の UNIQUE 制約により、重複Webhookは自動的にスキップされます。

---

### 3. コイン残高取得

#### GET /api/coins/balance/:userId

ユーザーのコイン残高を取得。

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `userId` | number | ママリユーザーID |

**レスポンス（成功）:**

```json
{
  "userId": 12345,
  "currentBalance": 550,
  "lastEarnedAt": "2026-02-16T06:00:00.000Z",
  "expiresAt": "2026-08-16T06:00:00.000Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `userId` | number | ユーザーID |
| `currentBalance` | number | 現在の残高 |
| `lastEarnedAt` | string | 最終獲得日時（ISO 8601） |
| `expiresAt` | string | 有効期限（ISO 8601） |

**エラー:**

| ステータス | エラーコード | 説明 |
|-----------|-------------|------|
| 404 | `RR0104` | ユーザーが存在しない |

**cURLサンプル:**

```bash
curl -X GET http://localhost:3001/api/coins/balance/12345
```

---

### 4. コイン履歴取得

#### GET /api/coins/history/:userId

ユーザーのコイン取引履歴を取得。

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `userId` | number | ママリユーザーID |

**クエリパラメータ:**

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `page` | number | 1 | ページ番号 |
| `limit` | number | 20 | 1ページあたりの件数（最大100） |
| `type` | string | - | 取引種別フィルタ（`earn`, `spend`, `expire`） |

**レスポンス（成功）:**

```json
{
  "userId": 12345,
  "transactions": [
    {
      "id": 1001,
      "amount": 100,
      "balanceAfter": 550,
      "transactionType": "earn",
      "description": "P&G おむつキャンペーン報酬",
      "createdAt": "2026-02-16T06:00:00.000Z"
    },
    {
      "id": 1002,
      "amount": -50,
      "balanceAfter": 450,
      "transactionType": "spend",
      "description": "Amazonギフト券500円分に交換",
      "createdAt": "2026-02-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 92,
    "itemsPerPage": 20
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `transactions[].id` | number | 取引ID |
| `transactions[].amount` | number | 増減量（正=獲得、負=消費） |
| `transactions[].balanceAfter` | number | 取引後残高 |
| `transactions[].transactionType` | string | `earn`, `spend`, `expire` |
| `transactions[].description` | string | 説明文 |
| `transactions[].createdAt` | string | 取引日時（ISO 8601） |

**cURLサンプル:**

```bash
curl -X GET "http://localhost:3001/api/coins/history/12345?page=1&limit=20&type=earn"
```

---

### 5. キャンペーン一覧取得

#### GET /api/campaigns

公開中のキャンペーン一覧を取得（ユーザー向けWebView用）。

**クエリパラメータ:**

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `page` | number | 1 | ページ番号 |
| `limit` | number | 20 | 1ページあたりの件数 |

**レスポンス（成功）:**

```json
{
  "campaigns": [
    {
      "id": 1,
      "receiptCampaignId": "319fd1f1-04d6-4943-8469-4dacbbb15a3a",
      "title": "P&G おむつキャンペーン",
      "description": "対象商品を購入してレシートを撮影するだけ！",
      "imageUrl": "https://...",
      "incentivePoints": 100,
      "serviceType": "receipt",
      "tags": ["おすすめ", "高ポイント"],
      "isActive": true,
      "displayOrder": 1
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 45
  }
}
```

**cURLサンプル:**

```bash
curl -X GET "http://localhost:3001/api/campaigns?page=1&limit=20"
```

---

### 6. ヘルスチェック

#### GET /health

APIサーバーの稼働状態を確認。

**レスポンス（成功）:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-16T06:00:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0"
}
```

**cURLサンプル:**

```bash
curl -X GET http://localhost:3001/health
```

---

## 共通仕様

### リクエストヘッダー

| ヘッダー | 必須 | 値 |
|---------|------|-----|
| `Content-Type` | ✅ | `application/json` |
| `Accept` | - | `application/json` |
| `X-Request-ID` | - | リクエストID（トレーサビリティ用） |

### レスポンスヘッダー

| ヘッダー | 値 |
|---------|-----|
| `Content-Type` | `application/json; charset=utf-8` |
| `X-Request-ID` | リクエストID（エコーバック） |

### ページネーション

リスト取得APIは以下のページネーション形式を使用：

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 195,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### タイムスタンプ

全てのタイムスタンプは **ISO 8601形式（UTC）** で返却：

```
2026-02-16T06:00:00.000Z
```

---

## エラーレスポンス

詳細は [ERROR_HANDLING.md](./ERROR_HANDLING.md) を参照。

### エラーレスポンス形式

```json
{
  "error": {
    "code": "RR0102",
    "message": "キャンペーンが登録されていません",
    "details": {
      "receipt_campaign_id": "319fd1f1-04d6-4943-8469-4dacbbb15a3a"
    },
    "timestamp": "2026-02-16T06:00:00.000Z"
  }
}
```

### よくあるエラー

| エラーコード | HTTPステータス | 説明 |
|-------------|---------------|------|
| `RR0701` | 400 | 必須パラメータ不足 |
| `RR0102` | 400 | キャンペーン未登録 |
| `RR0104` | 404 | ユーザーが存在しない |
| `RR0201` | 422 | コイン残高不足 |
| `RR0999` | 500 | システムエラー |

---

## 開発用モック

### モックサーバー起動

開発環境では、PMN APIをモック化できます：

```bash
# .envに追加
MOCK_PMN_API=true

# APIサーバー再起動
docker compose restart api
```

### モックWebhook送信

```bash
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "media_id": "mock_media_123",
    "media_user_code": "test-user-uuid",
    "receipt_campaign_id": "test-campaign-uuid",
    "receipt_campaign_name": "テストキャンペーン",
    "service_type": "receipt",
    "participation_timestamp": "2026-02-16T06:00:00+09:00",
    "processed_timestamp": "2026-02-16T06:05:00+09:00",
    "incentive_points": 100,
    "media_cashback_id": "test-cb-001",
    "media_cashback_code": "TESTCODE1234567"
  }'
```

---

## 参考リンク

- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - エラーハンドリング
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 開発ワークフロー
- [DATABASE.md](./DATABASE.md) - データベース設計

---

**最終更新日**: 2026-02-16
