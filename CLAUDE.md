# Receipt Reward - プロジェクトガイド

このドキュメントは、レシートリワードシステムの開発における**コーディング規約、ベストプラクティス、開発コマンド**をまとめたものです。

**アーキテクチャ設計の詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。**

## 応答ルール

Claude Codeでこのプロジェクトを開発する際の基本的な応答ルールです。

### 言語規則

- **日本語で応答**: すべての説明、コメント、コミットメッセージは日本語で記述する
- **コード内コメント**: 日本語で記述する
- **コミットメッセージ**: 日本語で記述する
- **識別子（変数名・関数名・クラス名）**: 英語のまま（このドキュメントの命名規則セクションに従う）

### コード例

```typescript
// ✅ OK: コメントは日本語、識別子は英語
export class ReceiptController {
  // レシートを作成する
  async createReceipt(data: CreateReceiptDto): Promise<Receipt> {
    // バリデーションを実行
    await this.validator.validate(data);

    // レシートを保存
    return await this.receiptService.create(data);
  }
}
```

```typescript
// ❌ NG: コメントが英語
export class ReceiptController {
  // Create a new receipt
  async createReceipt(data: CreateReceiptDto): Promise<Receipt> {
    // Validate input
    await this.validator.validate(data);

    // Save receipt
    return await this.receiptService.create(data);
  }
}
```

### コミットメッセージ例

```bash
# ✅ OK
git commit -m "feat: レシート作成APIを実装"

# ❌ NG
git commit -m "feat: Implement receipt creation API"
```

## プロジェクト概要

レシートリワードシステムは、**モノリポで管理される2つのマイクロサービス**で構成されるシステムです。

- **Backend API（Nest.js + TypeORM）**: ビジネスロジック、外部API連携、データ永続化
- **Frontend（React SPA）**: ユーザー向けWebView画面、クライアントサイドレンダリング
- **Admin（既存CakePHP）**: CS管理画面（別リポジトリ）

**プロジェクト管理**: https://github.com/orgs/Connehito/projects/50
**詳細な設計**: [ARCHITECTURE.md](./ARCHITECTURE.md)
**設計書**: https://github.com/Connehito/mamari-spec/issues/6512

## 技術スタック

### モノリポ管理
- **Turborepo 1.x** - モノリポビルドツール
- **pnpm 8.x** - パッケージマネージャー

### バックエンド
- **Nest.js 10.x** - TypeScript製フレームワーク
- **TypeORM** - ORMライブラリ（選定理由: [ADR - ORM選定](https://github.com/Connehito/mamari-spec/issues/6461#3-orm選定typeorm-vs-prisma)）
- **MySQL 8.0** - データベース（mamariqスキーマ）
- **Redis 7** - キャッシュ・セッション管理

### フロントエンド
- **React 18.x** - UI構築（SPA構成）
- **TypeScript 5.x** - 型安全な開発
- **Vite** - ビルドツール（予定）
- **React Router** - ルーティング（予定）

### インフラ
- **Frontend配信**: CloudFront + S3（静的ファイル配信）
- **Backend API**: AWS ECS Fargate + ALB（コンテナオーケストレーション）
- **AWS RDS** - マネージドMySQL
- **AWS ElastiCache** - マネージドRedis
- **AWS Secrets Manager** - シークレット管理

### CI/CD
- **GitHub Actions** - 自動テスト・デプロイ
- **Docker** - コンテナ化

## アーキテクチャ

Backend（apps/api）は**Clean Architecture**の4層構造を採用：

| 層 | 責務 |
| --- | --- |
| **Presenter** | HTTP通信、バリデーション、認証・認可 |
| **UseCase** | アプリケーションロジック、ビジネスフロー制御 |
| **Domain** | Entity、ValueObject、Repository Interface
**フレームワーク非依存** |
| **Infrastructure** | DB接続、外部API、キャッシュ
Domain層のInterfaceを実装 |

**詳細**: [ARCHITECTURE.md - レイヤー構造](./ARCHITECTURE.md#レイヤー構造clean-architecture)

## コーディング規約

### TypeScript

- **strict mode**: 必ず有効化
- **any禁止**: `any`の使用は原則禁止（やむを得ない場合は`unknown`を使用）
- **型の重複定義禁止**: 共通型は`packages/shared`で定義

### パッケージマネージャー

- **pnpmのみ使用**: npm, yarnは使用禁止
- **workspaces**: モノリポ構成で依存関係を管理

### コードフォーマット

- **Prettier**: 自動フォーマット
- **ESLint**: 静的解析
- **インデント**: 2スペース
- **セミコロン**: あり
- **シングルクォート**: 推奨

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | kebab-case | `receipt-controller.ts` |
| クラス名 | PascalCase | `ReceiptController` |
| 関数・変数 | camelCase | `createReceipt` |
| 定数 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| データベース | snake_case | `receipt_images` |
| 型・インターフェース | PascalCase | `Receipt`, `IReceiptRepository` |

## Backend規約

### データベースマイグレーション

**重要**: このリポジトリではTypeORMのマイグレーション機能を使用しません。

- **マイグレーション管理**: 別リポジトリ `mamari-db` で管理
  - リポジトリ: https://github.com/Connehito/mamari-db
  - ツール: Ridgepole（Ruby製スキーマ管理ツール）
  - スキーマファイル: `ridgepole/mamariq/Schemafile`
- **TypeORMの使用範囲**: データアクセスのみ（Entity定義、Repository実装）
- **マイグレーション方法**: `mamari-db` リポジトリでスキーマ変更をコミット → 適用
- **テーブル定義の確認**: `mamari-db` リポジトリの Schemafile を参照

**禁止事項**:
- ❌ TypeORMのマイグレーションファイル（`*.migration.ts`）を作成してはいけない
- ❌ `typeorm migration:generate` / `typeorm migration:run` コマンドを実行してはいけない
- ❌ このリポジトリでテーブル構造を変更してはいけない

**OK**:
- ✅ TypeORM Entityを定義してデータアクセス
- ✅ Repositoryパターンでビジネスロジックを実装
- ✅ テーブル構造変更が必要な場合は `mamari-db` リポジトリで対応

### ファイル構成

**1ファイル1クラス原則**
```
receipt.controller.ts         → ReceiptController
create-receipt.use-case.ts    → CreateReceiptUseCase
receipt.entity.ts             → Receipt
```

### UseCase実装

すべてのUseCaseは`execute()`メソッドを持つ：

```typescript
// create-receipt.use-case.ts
import { Injectable } from '@nestjs/common';
import { IReceiptRepository } from '../../domain/repositories/receipt.repository.interface';

@Injectable()
export class CreateReceiptUseCase {
  constructor(
    private readonly receiptRepository: IReceiptRepository,
  ) {}

  async execute(input: CreateReceiptInput): Promise<CreateReceiptOutput> {
    // ビジネスロジック
    const receipt = Receipt.create(input);
    await this.receiptRepository.save(receipt);
    return { receipt };
  }
}
```

### Repository パターン

**Interface (Domain層)**
```typescript
// domain/repositories/receipt.repository.interface.ts
export interface IReceiptRepository {
  findById(id: string): Promise<Receipt | null>;
  save(receipt: Receipt): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Implementation (Infrastructure層)**
```typescript
// infrastructure/repositories/receipt.repository.ts
import { Injectable } from '@nestjs/common';
import { IReceiptRepository } from '../../domain/repositories/receipt.repository.interface';

@Injectable()
export class ReceiptRepository implements IReceiptRepository {
  async findById(id: string): Promise<Receipt | null> {
    // データベースアクセス実装
  }

  async save(receipt: Receipt): Promise<void> {
    // データベースアクセス実装
  }

  async delete(id: string): Promise<void> {
    // データベースアクセス実装
  }
}
```

## Frontend規約

### React SPA構成

- **SPA（Single Page Application）**: SSR/SSG不要（WebView内）
- **Vite + React**: モダンなビルドツール
- **React Router**: クライアントサイドルーティング

### ディレクトリ構成

```
src/
├── pages/                # ページコンポーネント
│   ├── Home.tsx         # レシートリワードTOP
│   ├── History.tsx      # コイン履歴
│   └── Receipt.tsx      # レシート詳細
├── components/           # 再利用可能なコンポーネント
│   ├── receipt/
│   │   ├── ReceiptList.tsx
│   │   └── ReceiptCard.tsx
│   └── common/
│       ├── Button.tsx
│       └── Input.tsx
├── lib/                  # ユーティリティ
│   ├── api-client.ts    # APIクライアント
│   └── utils.ts
├── hooks/               # カスタムフック
│   └── useCoinBalance.ts
├── App.tsx              # ルートコンポーネント
└── main.tsx             # エントリーポイント
```

### API通信

APIクライアントは`src/lib/api-client.ts`に集約：

```typescript
// src/lib/api-client.ts
import { Receipt } from '@repo/shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const receiptApi = {
  async getReceipts(): Promise<Receipt[]> {
    const res = await fetch(`${API_BASE_URL}/receipts`);
    return res.json();
  },

  async createReceipt(data: FormData): Promise<Receipt> {
    const res = await fetch(`${API_BASE_URL}/receipts`, {
      method: 'POST',
      body: data,
    });
    return res.json();
  },
};
```

## よく使うコマンド

### 開発環境

```bash
# 全ての開発サーバーを起動
pnpm dev

# APIのみ起動
pnpm dev:api

# Webのみ起動
pnpm dev:web
```

### ビルド

```bash
# 全体をビルド
pnpm build

# 特定のアプリをビルド
pnpm --filter api build
pnpm --filter web build
```

### テスト

```bash
# 全てのテストを実行
pnpm test

# 特定のアプリのテスト
pnpm --filter api test
pnpm --filter web test

# カバレッジ付きテスト
pnpm test --coverage

# ウォッチモード
pnpm test --watch
```

### Lint/Format

```bash
# Lint実行
pnpm lint

# Lint自動修正
pnpm lint --fix

# フォーマット
pnpm format
```

### Docker

```bash
# コンテナ起動（初回ビルド）
docker compose up --build

# コンテナ起動（バックグラウンド）
docker compose up -d

# ログ確認
docker compose logs -f

# コンテナ停止
docker compose down

# キャッシュクリアして再ビルド
docker compose build --no-cache
```

### パッケージ管理

```bash
# 依存関係をインストール
pnpm install

# パッケージを追加（ルート）
pnpm add -w <package>

# パッケージを追加（特定のアプリ）
pnpm --filter api add <package>
pnpm --filter web add <package>

# devDependenciesに追加
pnpm --filter api add -D <package>
```

## Git Hooks（セキュリティチェック）

### pre-commitフックの設定

コミット前に自動的にセンシティブ情報をチェックするGit Hooksを設定できます。

```bash
# Git Hooksをセットアップ（初回のみ）
./scripts/setup-hooks.sh
```

### チェック内容

pre-commitフックは以下をチェックします：

1. **.envファイルの誤コミット防止**
   - `.env`, `.env.local`, `.env.production`
   - `secrets.json`, `credentials.json`

2. **APIキー・トークンの検出**
   - AWS アクセスキー: `AKIA[0-9A-Z]{16}`
   - GitHub トークン: `ghp_[a-zA-Z0-9]{36}`
   - Stripe キー: `sk_live_*`, `pk_live_*`

3. **ハードコードされたパスワード**
   - `password = "..."`（環境変数経由でないもの）

4. **秘密鍵**
   - `-----BEGIN PRIVATE KEY-----`
   - `-----BEGIN RSA PRIVATE KEY-----`

5. **データベース接続文字列**
   - パスワードを含む接続URL（`mysql://user:password@host`）

### チェックから除外されるもの

- テストファイル（`*.test.ts`, `*.spec.ts`）のモックデータ
- 環境変数参照（`process.env.PASSWORD`, `configService.get('PASSWORD')`）

### エラー発生時の対処

```bash
# センシティブ情報が検出された場合、コミットは中止されます
❌ エラー: APIキー・トークンが検出されました: apps/api/src/config/api.ts

# 対処方法:
# 1. センシティブ情報を環境変数に移動
# 2. AWS Secrets Managerの使用を検討
# 3. git restore --staged <file> でステージングを解除
```

## 外部連携の注意点

### Performance Media Network API連携

**JWE暗号化方式**:
- **アルゴリズム**: A256GCM（AES-256-GCM）
- **鍵管理**: AWS Secrets Managerで管理（`encryption_key`と`client_id`）
- **初期化ベクタ（IV）**: 毎回ランダム生成必須（同じIVの再利用禁止）
- **トークン**: 1回限り有効（使い回し禁止）

```typescript
// usecase/auth/generate-jwe-token.usecase.ts
import * as jose from 'jose';

async execute(userId: number): Promise<string> {
  const { encryptionKey, clientId } = await this.secretsService.getPMNCredentials();
  const key = Buffer.from(encryptionKey, 'base64');

  const payload = { media_user_code: userId.toString() };

  const jwe = await new jose.CompactEncrypt(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setProtectedHeader({
      alg: 'dir',
      enc: 'A256GCM',
      kid: clientId,  // Performance Media Network仕様
    })
    .encrypt(key);

  return jwe;
}
```

**詳細**: [ARCHITECTURE.md - JWE暗号化](./ARCHITECTURE.md#jwe暗号化復号化performance-media-network仕様)

### Webhook受信（べき等性保証）

**重要**: 同じWebhookが複数回送信される可能性があるため、べき等性を確保する必要があります。

**実装ポイント**:
1. **`media_cashback_id`にUNIQUE制約**: 重複登録を防ぐ
2. **重複時は200 OK返却**: リトライさせない
3. **トランザクション内で処理**: 3テーブル（`reci_toku_rewards`, `reci_toku_user_coins`, `reci_toku_coin_transactions`）を原子的に更新

```typescript
// presenter/http/webhook/webhook.controller.ts
@Post('webhook')
async handleWebhook(@Body() payload: WebhookPayload) {
  try {
    await this.processWebhookUseCase.execute(payload);
    return { status: 'success' };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // 既に処理済み（べき等性）
      return { status: 'already_processed' };
    }
    throw error;
  }
}
```

**データベーススキーマ**:
```sql
CREATE TABLE reci_toku_rewards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id BIGINT UNSIGNED NOT NULL,
  media_cashback_id VARCHAR(36) NOT NULL UNIQUE,  -- べき等性確保
  media_cashback_code VARCHAR(15) NOT NULL,        -- 15桁コード
  incentive_points INT NOT NULL,
  -- ...
) ENGINE=InnoDB;
```

**詳細**: [ARCHITECTURE.md - Webhook受信処理](./ARCHITECTURE.md#webhook受信処理べき等性保証)

## テスト方針

### テスト戦略

**必須テスト**:
- UseCaseのユニットテスト
- Domain層のユニットテスト（Entity, ValueObject）

**推奨テスト**:
- Controller/Presenter層の統合テスト
- Repository層の統合テスト

**オプション**:
- E2Eテスト（重要なフローのみ）

### テストファイルの配置

テストファイルは対象ファイルと同じディレクトリに配置：

```
src/
├── usecase/
│   └── coin/
│       ├── create-receipt.use-case.ts
│       └── create-receipt.use-case.spec.ts  ← 同階層
```

### テストの命名規則

```typescript
// create-receipt.use-case.spec.ts
describe('CreateReceiptUseCase', () => {
  describe('execute', () => {
    it('正常なレシート情報でレシートを作成できる', async () => {
      // Arrange
      const input = { userId: '123', imageUrl: 'https://...' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.receipt.userId).toBe('123');
    });

    it('不正な画像URLの場合はエラーをスローする', async () => {
      // Arrange
      const input = { userId: '123', imageUrl: 'invalid' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow();
    });
  });
});
```

### モックの使用

```typescript
// Repositoryのモック
const mockReceiptRepository: jest.Mocked<IReceiptRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => {
  useCase = new CreateReceiptUseCase(mockReceiptRepository);
});
```

## やってはいけないこと

### 🚫 Domain層にフレームワーク依存を持ち込む

**NG例**
```typescript
// domain/entities/receipt.entity.ts
import { Injectable } from '@nestjs/common';  // NG: NestJS依存

@Injectable()  // NG
export class Receipt {
  // ...
}
```

**OK例**
```typescript
// domain/entities/receipt.entity.ts
export class Receipt {  // OK: フレームワーク非依存
  private constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}

  static create(props: ReceiptProps): Receipt {
    // バリデーション
    return new Receipt(props.id, props.userId);
  }
}
```

### 🚫 環境変数のハードコード

**NG例**
```typescript
const apiUrl = 'https://api.example.com';  // NG
const apiKey = 'abc123';  // NG: シークレットのハードコード
```

**OK例**
```typescript
const apiUrl = process.env.API_URL;  // OK
const apiKey = await secretsManager.getSecret('API_KEY');  // OK
```

### 🚫 anyの使用

**NG例**
```typescript
function processData(data: any): any {  // NG
  return data.value;
}
```

**OK例**
```typescript
function processData(data: unknown): string {  // OK
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  throw new Error('Invalid data');
}
```

### 🚫 型定義の重複

**NG例**
```typescript
// apps/api/src/types.ts
export interface Receipt { id: string; }  // NG

// apps/web/src/types.ts
export interface Receipt { id: string; }  // NG: 重複定義
```

**OK例**
```typescript
// packages/shared/src/types/receipt.ts
export interface Receipt { id: string; }  // OK: 共通定義

// apps/api と apps/web で import して使用
import { Receipt } from '@repo/shared/types';
```

### 🚫 npm/yarnの使用

**NG例**
```bash
npm install express  # NG
yarn add express     # NG
```

**OK例**
```bash
pnpm add express  # OK
```

### 🚫 直接のデータベースアクセス

**NG例**
```typescript
// use-case内で直接SQL実行
@Injectable()
export class CreateReceiptUseCase {
  async execute(input: Input) {
    await this.connection.query('INSERT INTO receipts ...');  // NG
  }
}
```

**OK例**
```typescript
// Repository経由でアクセス
@Injectable()
export class CreateReceiptUseCase {
  constructor(private readonly repository: IReceiptRepository) {}

  async execute(input: Input) {
    await this.repository.save(receipt);  // OK
  }
}
```

### 🚫 console.logの残存

**NG例**
```typescript
console.log('Debug info:', data);  // NG: 本番環境に残す
```

**OK例**
```typescript
this.logger.debug('Debug info:', data);  // OK: Loggerを使用
```

### 🚫 TypeORMマイグレーションの使用

**NG例**
```bash
typeorm migration:generate src/migrations/CreateReceiptTable  # NG
typeorm migration:run  # NG
```

```typescript
// src/migrations/1234567890-create-receipt-table.ts
@Migration()
export class CreateReceiptTable1234567890 implements MigrationInterface {
  // NG: このリポジトリでマイグレーションファイルを作成してはいけない
}
```

**OK例**
```bash
# mamari-db リポジトリでスキーマ変更
cd /path/to/mamari-db
vi ridgepole/mamariq/Schemafile  # Ridgepoleでスキーマ定義
git commit -m "feat: reci_toku_rewardsテーブルを追加"
```

**理由**:
- DBマイグレーションは `mamari-db` リポジトリで一元管理
- 複数リポジトリでマイグレーションを管理すると整合性が取れなくなる
- Ridgepoleでスキーマ定義の方が差分管理がしやすい

---

## 参考リンク

- **[プロジェクト管理（GitHub Projects）](https://github.com/orgs/Connehito/projects/50)** - タスク管理・進捗確認
- **[アーキテクチャ設計書（ARCHITECTURE.md）](./ARCHITECTURE.md)** - システム構成・インフラ設計の詳細
- [設計書](https://github.com/Connehito/mamari-spec/issues/6512)
- [Turborepo公式ドキュメント](https://turbo.build/)
- [Nest.js公式ドキュメント](https://docs.nestjs.com/)
- [TypeORM公式ドキュメント](https://typeorm.io/)
- [React公式ドキュメント](https://react.dev/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [ADR：なぜNest.js(TS + Clean Architecture) + React(+TS)を選んだか](https://github.com/Connehito/mamari-spec/issues/6461)

---

**最終更新日**: 2026-02-19（技術選定の変更を反映：Frontend React SPA、Backend TypeORM）
