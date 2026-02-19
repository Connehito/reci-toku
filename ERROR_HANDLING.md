# エラーハンドリング戦略

このドキュメントは、レシートリワードシステムにおけるエラーハンドリングの統一方針をまとめたものです。

---

## 目次

1. [エラーコード体系](#エラーコード体系)
2. [エラーレスポンス形式](#エラーレスポンス形式)
3. [HTTPステータスコード](#httpステータスコード)
4. [ログ出力規約](#ログ出力規約)
5. [エラー種別と対応方針](#エラー種別と対応方針)
6. [実装例](#実装例)

---

## エラーコード体系

### コードフォーマット

```
RR[カテゴリ][連番]
```

- `RR`: Receipt Reward の略
- カテゴリ: 2桁（下記参照）
- 連番: 2桁（01〜99）

### カテゴリ一覧

| カテゴリ | コード範囲 | 用途 |
|---------|-----------|------|
| **Webhook** | `RR01xx` | Webhook受信・処理エラー |
| **コイン** | `RR02xx` | コイン残高・取引エラー |
| **認証** | `RR03xx` | JWE暗号化・認証エラー |
| **キャンペーン** | `RR04xx` | キャンペーン管理エラー |
| **外部API** | `RR05xx` | PMN/ドットマネーAPI連携エラー |
| **DB** | `RR06xx` | データベース関連エラー |
| **バリデーション** | `RR07xx` | 入力値検証エラー |
| **システム** | `RR09xx` | その他システムエラー |

### エラーコード定義

#### Webhook関連（RR01xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0101` | べき等性違反（重複Webhook） | 200 | 正常応答（リトライさせない） |
| `RR0102` | キャンペーン未登録 | 400 | CS担当者へ通知 |
| `RR0103` | JWE復号化失敗 | 400 | ペイロード検証・鍵確認 |
| `RR0104` | ユーザーが存在しない | 400 | media_user_code確認 |
| `RR0105` | トランザクションエラー | 500 | リトライ許可 |

#### コイン関連（RR02xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0201` | コイン残高不足 | 400 | ユーザーへエラー表示 |
| `RR0202` | コイン有効期限切れ | 400 | ユーザーへエラー表示 |
| `RR0203` | 不正なコイン増減量 | 400 | バリデーションエラー |
| `RR0204` | 残高不整合検出 | 500 | 緊急アラート |

#### 認証関連（RR03xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0301` | JWE暗号化失敗 | 500 | Secrets Manager確認 |
| `RR0302` | 暗号化鍵取得失敗 | 500 | AWS権限確認 |
| `RR0303` | 無効なclient_id | 400 | 設定確認 |

#### キャンペーン関連（RR04xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0401` | キャンペーンが存在しない | 404 | 404エラー |
| `RR0402` | キャンペーンが非公開 | 403 | アクセス不可 |
| `RR0403` | キャンペーン期間外 | 400 | ユーザーへエラー表示 |

#### 外部API関連（RR05xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0501` | PMN APIタイムアウト | 504 | リトライ |
| `RR0502` | PMN API異常応答 | 502 | エラーログ記録・監視 |
| `RR0503` | ドットマネーAPI連携エラー | 500 | リトライ |

#### DB関連（RR06xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0601` | DB接続エラー | 500 | 緊急アラート |
| `RR0602` | クエリタイムアウト | 500 | スロークエリ調査 |
| `RR0603` | UNIQUE制約違反 | 409 | べき等性確認 |

#### バリデーション関連（RR07xx）

| コード | 意味 | HTTPステータス | 対応方針 |
|--------|------|----------------|----------|
| `RR0701` | 必須パラメータ不足 | 400 | バリデーションエラー |
| `RR0702` | 不正なフォーマット | 400 | バリデーションエラー |
| `RR0703` | 値の範囲外 | 400 | バリデーションエラー |

---

## エラーレスポンス形式

### 基本フォーマット

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

### フィールド定義

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `error.code` | string | ✅ | エラーコード（RRxxxx形式） |
| `error.message` | string | ✅ | ユーザー向けエラーメッセージ（日本語） |
| `error.details` | object | - | 詳細情報（デバッグ用） |
| `error.timestamp` | string | ✅ | エラー発生時刻（ISO 8601形式） |

### べき等性エラー（特殊ケース）

重複Webhook受信時は、エラーではなく正常応答：

```json
{
  "status": "already_processed",
  "message": "このWebhookは既に処理済みです",
  "media_cashback_id": "xxx-xxx-xxx"
}
```

**HTTPステータス**: 200 OK（リトライさせない）

---

## HTTPステータスコード

### 使用するステータスコード

| コード | 意味 | 使用例 |
|--------|------|--------|
| **200** | 成功 | 正常処理、べき等性エラー |
| **201** | 作成成功 | リソース新規作成 |
| **400** | 不正なリクエスト | バリデーションエラー、キャンペーン未登録 |
| **401** | 認証エラー | JWEトークン不正 |
| **403** | 権限エラー | 非公開キャンペーンへのアクセス |
| **404** | 存在しない | リソースが見つからない |
| **409** | 競合 | UNIQUE制約違反 |
| **422** | 処理不可 | 論理エラー（残高不足等） |
| **500** | サーバーエラー | 予期しないエラー |
| **502** | Bad Gateway | 外部API異常応答 |
| **503** | サービス利用不可 | メンテナンス中 |
| **504** | Gateway Timeout | 外部APIタイムアウト |

### ステータスコード選択フローチャート

```
リクエスト受信
  ↓
バリデーションOK? → No → 400 Bad Request
  ↓ Yes
認証OK? → No → 401 Unauthorized
  ↓ Yes
リソース存在? → No → 404 Not Found
  ↓ Yes
権限あり? → No → 403 Forbidden
  ↓ Yes
ビジネスロジックOK? → No → 422 Unprocessable Entity
  ↓ Yes
200 OK / 201 Created
```

---

## ログ出力規約

### ログレベル

| レベル | 用途 | 例 |
|--------|------|-----|
| **error** | システムエラー、緊急対応必要 | DB接続エラー、外部API障害 |
| **warn** | 警告、監視対象 | リトライ発生、残高不整合 |
| **info** | 重要な処理の開始・終了 | Webhook受信、コイン付与完了 |
| **debug** | 詳細なデバッグ情報 | SQLクエリ、変数の値 |

### ログフォーマット

```typescript
// エラーログ
this.logger.error('Webhook処理エラー', {
  errorCode: 'RR0102',
  errorMessage: 'キャンペーンが登録されていません',
  receiptCampaignId: payload.receipt_campaign_id,
  userId: userId,
  stack: error.stack,
});

// 情報ログ
this.logger.info('Webhook受信', {
  mediaCashbackId: payload.media_cashback_id,
  userId: userId,
  incentivePoints: payload.incentive_points,
});

// デバッグログ
this.logger.debug('JWE復号化完了', {
  payload: decryptedPayload,
});
```

### ログに含めるべき情報

**必須:**
- エラーコード（errorCode）
- エラーメッセージ（errorMessage）
- タイムスタンプ（自動）
- リクエストID（トレーサビリティ用）

**推奨:**
- ユーザーID
- 関連するリソースID（media_cashback_id, receipt_campaign_id等）
- スタックトレース（errorレベル時）

**禁止:**
- パスワード
- 暗号化鍵
- 個人情報（氏名、メールアドレス等）

---

## エラー種別と対応方針

### 1. バリデーションエラー

**特徴:**
- ユーザー入力の不備
- リクエスト時点で検出可能

**対応:**
- HTTPステータス: 400
- リトライ不要
- ユーザーへエラーメッセージ表示

**実装:**
```typescript
throw new BadRequestException({
  code: 'RR0701',
  message: '必須パラメータが不足しています',
  details: { missingFields: ['userId'] },
});
```

---

### 2. ビジネスロジックエラー

**特徴:**
- 残高不足、有効期限切れ等
- データの状態に依存

**対応:**
- HTTPステータス: 422
- リトライ不要
- ユーザーへ分かりやすいエラー表示

**実装:**
```typescript
throw new UnprocessableEntityException({
  code: 'RR0201',
  message: 'コイン残高が不足しています',
  details: { requiredCoins: 100, currentBalance: 50 },
});
```

---

### 3. 外部システムエラー

**特徴:**
- PMN API、Secrets Manager等の障害
- 一時的な可能性がある

**対応:**
- HTTPステータス: 502/504
- リトライ許可（指数バックオフ）
- 監視アラート発火

**実装:**
```typescript
throw new BadGatewayException({
  code: 'RR0502',
  message: 'Performance Media Network APIでエラーが発生しました',
  details: { externalError: externalResponse.error },
});
```

---

### 4. システムエラー

**特徴:**
- DB接続エラー、予期しない例外
- 緊急対応が必要

**対応:**
- HTTPステータス: 500
- リトライ許可
- 緊急アラート（PagerDuty/Slack）
- ログに詳細情報を記録

**実装:**
```typescript
try {
  // 処理
} catch (error) {
  this.logger.error('予期しないエラー', {
    errorCode: 'RR0999',
    errorMessage: error.message,
    stack: error.stack,
  });

  throw new InternalServerErrorException({
    code: 'RR0999',
    message: 'システムエラーが発生しました',
  });
}
```

---

## 実装例

### Exception Filterの実装

```typescript
// src/presenter/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // エラーログ出力
    this.logger.error('HTTPエラー発生', {
      status,
      response: exceptionResponse,
    });

    // エラーレスポンス
    response.status(status).json({
      error: {
        code: exceptionResponse['code'] || 'RR0999',
        message: exceptionResponse['message'] || 'システムエラーが発生しました',
        details: exceptionResponse['details'] || {},
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

### UseCaseでのエラーハンドリング

```typescript
// src/usecase/webhook/process-webhook.usecase.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);

  async execute(payload: WebhookPayload): Promise<void> {
    // 1. キャンペーン存在チェック
    const campaign = await this.campaignRepository.findByReceiptCampaignId(
      payload.receipt_campaign_id,
    );

    if (!campaign) {
      this.logger.warn('キャンペーン未登録', {
        receiptCampaignId: payload.receipt_campaign_id,
      });

      throw new BadRequestException({
        code: 'RR0102',
        message: 'キャンペーンが登録されていません',
        details: {
          receipt_campaign_id: payload.receipt_campaign_id,
        },
      });
    }

    // 2. べき等性チェック
    const existingReward = await this.rewardRepository.findByMediaCashbackId(
      payload.media_cashback_id,
    );

    if (existingReward) {
      this.logger.info('重複Webhook受信（べき等性）', {
        mediaCashbackId: payload.media_cashback_id,
      });

      // 200 OKを返す（エラーではない）
      return;
    }

    // 3. トランザクション処理
    try {
      await this.transactionManager.run(async () => {
        await this.rewardRepository.save(reward);
        await this.coinRepository.updateBalance(userId, amount);
        await this.transactionRepository.save(transaction);
      });

      this.logger.info('Webhook処理完了', {
        mediaCashbackId: payload.media_cashback_id,
        userId: userId,
        incentivePoints: payload.incentive_points,
      });
    } catch (error) {
      this.logger.error('トランザクションエラー', {
        errorCode: 'RR0105',
        mediaCashbackId: payload.media_cashback_id,
        error: error.message,
        stack: error.stack,
      });

      throw new InternalServerErrorException({
        code: 'RR0105',
        message: 'コイン付与処理でエラーが発生しました',
      });
    }
  }
}
```

---

## 監視・アラート設計

### アラート対象

| エラーコード範囲 | 重要度 | 通知先 |
|----------------|--------|--------|
| `RR06xx` (DB) | 🔴 緊急 | PagerDuty → オンコール担当者 |
| `RR03xx` (認証) | 🔴 緊急 | Slack + PagerDuty |
| `RR05xx` (外部API) | 🟡 警告 | Slack |
| `RR01xx` (Webhook) | 🟢 情報 | CloudWatch Logs |

### メトリクス

CloudWatch Metricsで監視：

- エラー発生率（error/total requests）
- エラーコード別発生数
- レスポンスタイム（P50, P95, P99）
- 外部API失敗率

---

## 参考リンク

- [CLAUDE.md](./CLAUDE.md) - コーディング規約
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 開発ワークフロー
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティング

---

**最終更新日**: 2026-02-16
