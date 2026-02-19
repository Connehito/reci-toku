# NestJS実装パターン（Clean Architecture準拠）

このドキュメントは、Clean Architectureに準拠したNestJS v10の実装パターンをまとめたものです。

---

## 目次

1. [モジュール設計](#モジュール設計)
2. [依存性注入（DI）](#依存性注入di)
3. [Repository InterfaceとImplementationの紐付け](#repository-interfaceとimplementationの紐付け)
4. [UseCase実装パターン](#usecase実装パターン)
5. [Controller実装パターン](#controller実装パターン)
6. [エラーハンドリング](#エラーハンドリング)
7. [テスタビリティ](#テスタビリティ)

---

## モジュール設計

### レイヤー構造とモジュール

Clean Architectureに準拠した場合、以下のレイヤーごとにモジュールを構成します。

```
src/
├── domain/                     # Domain層（フレームワーク非依存）
│   └── reward/
│       ├── reward.entity.ts
│       └── reward.repository.interface.ts
├── usecase/                    # UseCase層
│   └── webhook/
│       └── webhook.module.ts   # ← UseCaseモジュール
├── infrastructure/             # Infrastructure層
│   └── database/
│       └── database.module.ts  # ← Infrastructureモジュール
└── presenter/                  # Presenter層
    └── http/
        └── webhook/
            └── webhook.module.ts # ← Presenterモジュール
```

---

### 基本的なモジュール構成

```typescript
// src/usecase/webhook/webhook.module.ts
import { Module } from '@nestjs/common';
import { ProcessWebhookUseCase } from './process-webhook.usecase';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [
    DatabaseModule, // Repositoryを提供するモジュール
  ],
  providers: [
    ProcessWebhookUseCase, // UseCaseを提供
  ],
  exports: [
    ProcessWebhookUseCase, // 他のモジュールから使えるようにエクスポート
  ],
})
export class WebhookModule {}
```

**ポイント:**
- ✅ `imports`: 依存する他のモジュール
- ✅ `providers`: このモジュールが提供するサービス
- ✅ `exports`: 他のモジュールから使えるようにする

---

## 依存性注入（DI）

### パターン1: クラスベースの注入（標準）

**最もシンプルなパターン**

```typescript
// UseCase
import { Injectable } from '@nestjs/common';
import { RewardRepository } from '../../infrastructure/database/repositories/reward.repository';

@Injectable()
export class ProcessWebhookUseCase {
  constructor(
    private readonly rewardRepository: RewardRepository, // クラスで直接注入
  ) {}

  async execute() {
    await this.rewardRepository.save(/* ... */);
  }
}
```

**Module定義:**

```typescript
@Module({
  providers: [
    ProcessWebhookUseCase,
    RewardRepository, // 自動的に注入される
  ],
})
export class WebhookModule {}
```

**メリット:**
- ✅ シンプル
- ✅ 設定が少ない

**デメリット:**
- ❌ 具象クラスに依存（Clean Architecture的には望ましくない）
- ❌ テスト時のモック化が面倒

---

### パターン2: トークンベースの注入（推奨）

**Clean Architectureに準拠したパターン**

#### Step 1: トークン定義

```typescript
// src/domain/reward/reward.repository.interface.ts
import { Reward } from './reward.entity';

// トークン定義
export const REWARD_REPOSITORY = Symbol('IRewardRepository');

// Repository Interface
export interface IRewardRepository {
  findById(id: number): Promise<Reward | null>;
  findByMediaCashbackId(mediaCashbackId: string): Promise<Reward | null>;
  save(reward: Reward): Promise<Reward>;
}
```

#### Step 2: UseCase実装

```typescript
// src/usecase/webhook/process-webhook.usecase.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  IRewardRepository,
  REWARD_REPOSITORY,
} from '../../domain/reward/reward.repository.interface';

@Injectable()
export class ProcessWebhookUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY) // トークンで注入
    private readonly rewardRepository: IRewardRepository, // インターフェースで型付け
  ) {}

  async execute() {
    // インターフェース経由でアクセス
    await this.rewardRepository.save(/* ... */);
  }
}
```

#### Step 3: Module定義

```typescript
// src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardEntity } from './entities/reward.entity';
import { RewardRepository } from './repositories/reward.repository';
import { REWARD_REPOSITORY } from '../../domain/reward/reward.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([RewardEntity]), // TypeORM Entityを登録
  ],
  providers: [
    {
      provide: REWARD_REPOSITORY, // トークン
      useClass: RewardRepository,  // 実装クラス
    },
  ],
  exports: [
    REWARD_REPOSITORY, // トークンをエクスポート
  ],
})
export class DatabaseModule {}
```

**メリット:**
- ✅ インターフェースに依存（DIP準拠）
- ✅ テスト時のモック化が簡単
- ✅ 実装を差し替え可能

---

### パターン3: ファクトリーパターン（複雑な生成ロジック）

```typescript
// Module定義
@Module({
  providers: [
    {
      provide: REWARD_REPOSITORY,
      useFactory: (dataSource: DataSource, logger: Logger) => {
        // 複雑な初期化ロジック
        return new RewardRepository(
          dataSource.getRepository(RewardEntity),
          logger,
        );
      },
      inject: [DataSource, Logger], // ファクトリーの依存
    },
  ],
})
export class DatabaseModule {}
```

---

## Repository InterfaceとImplementationの紐付け

### 推奨パターン: 各ドメインごとにトークン定義

```typescript
// src/domain/tokens.ts（トークンを一箇所にまとめる）
export const REWARD_REPOSITORY = Symbol('IRewardRepository');
export const COIN_REPOSITORY = Symbol('ICoinRepository');
export const CAMPAIGN_REPOSITORY = Symbol('ICampaignRepository');
export const TRANSACTION_REPOSITORY = Symbol('ITransactionRepository');
```

```typescript
// src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardEntity } from './entities/reward.entity';
import { CoinEntity } from './entities/coin.entity';
import { RewardRepository } from './repositories/reward.repository';
import { CoinRepository } from './repositories/coin.repository';
import {
  REWARD_REPOSITORY,
  COIN_REPOSITORY,
} from '../../domain/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RewardEntity,
      CoinEntity,
      // ... 他のEntity
    ]),
  ],
  providers: [
    // Reward Repository
    {
      provide: REWARD_REPOSITORY,
      useClass: RewardRepository,
    },
    // Coin Repository
    {
      provide: COIN_REPOSITORY,
      useClass: CoinRepository,
    },
  ],
  exports: [
    REWARD_REPOSITORY,
    COIN_REPOSITORY,
  ],
})
export class DatabaseModule {}
```

---

## UseCase実装パターン

### 基本パターン

```typescript
// src/usecase/webhook/process-webhook.usecase.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IRewardRepository, REWARD_REPOSITORY } from '../../domain/reward/reward.repository.interface';
import { ICoinRepository, COIN_REPOSITORY } from '../../domain/coin/coin.repository.interface';

@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);

  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
    @Inject(COIN_REPOSITORY)
    private readonly coinRepository: ICoinRepository,
    private readonly dataSource: DataSource, // トランザクション用
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    this.logger.log('Webhook処理開始', { mediaCashbackId: payload.media_cashback_id });

    // トランザクション制御
    await this.dataSource.transaction(async (manager) => {
      // 1. べき等性チェック
      const existing = await this.rewardRepository.findByMediaCashbackId(
        payload.media_cashback_id,
      );

      if (existing) {
        this.logger.warn('重複Webhook（べき等性）', {
          mediaCashbackId: payload.media_cashback_id,
        });
        return; // 200 OKで返す
      }

      // 2. Domain Entityを作成
      const reward = Reward.create({
        userId: payload.user_id,
        campaignId: payload.campaign_id,
        mediaCashbackId: payload.media_cashback_id,
        mediaCashbackCode: payload.media_cashback_code,
        incentivePoints: payload.incentive_points,
      });

      // 3. 保存
      await this.rewardRepository.save(reward);

      // 4. コイン残高更新
      await this.coinRepository.incrementBalance(
        payload.user_id,
        payload.incentive_points,
      );

      this.logger.log('Webhook処理完了', {
        mediaCashbackId: payload.media_cashback_id,
        userId: payload.user_id,
      });
    });
  }
}
```

**ポイント:**
- ✅ `@Injectable()` デコレータ必須
- ✅ `@Inject(TOKEN)` でインターフェース注入
- ✅ `Logger` でログ出力
- ✅ `DataSource.transaction()` でトランザクション制御

---

## Controller実装パターン

### RESTful Controller

```typescript
// src/presenter/http/webhook/webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ProcessWebhookUseCase } from '../../../usecase/webhook/process-webhook.usecase';
import { WebhookDto } from './dto/webhook.dto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK) // 200 OKを返す
  async handleWebhook(@Body() dto: WebhookDto) {
    try {
      await this.processWebhookUseCase.execute(dto);

      return {
        status: 'success',
        message: 'Webhookを処理しました',
      };
    } catch (error) {
      this.logger.error('Webhook処理エラー', {
        error: error.message,
        stack: error.stack,
      });

      // エラーハンドリング
      if (error.code === 'RR0102') {
        throw new BadRequestException({
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      throw error;
    }
  }
}
```

**ポイント:**
- ✅ `@Controller()` でルートパス指定
- ✅ `@Post()`, `@Get()` でHTTPメソッド指定
- ✅ `@Body()` でリクエストボディ取得
- ✅ `@HttpCode()` でステータスコード制御
- ✅ DTOでバリデーション

---

### DTO定義（バリデーション付き）

```typescript
// src/presenter/http/webhook/dto/webhook.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';

export class WebhookDto {
  @IsString()
  @IsNotEmpty()
  media_id: string;

  @IsString()
  @IsNotEmpty()
  media_user_code: string;

  @IsString()
  @IsNotEmpty()
  receipt_campaign_id: string;

  @IsString()
  @IsNotEmpty()
  receipt_campaign_name: string;

  @IsNumber()
  incentive_points: number;

  @IsString()
  @IsNotEmpty()
  media_cashback_id: string;

  @IsString()
  @IsNotEmpty()
  media_cashback_code: string;

  @IsDateString()
  participation_timestamp: string;

  @IsDateString()
  processed_timestamp: string;
}
```

**自動バリデーションの有効化:**

```typescript
// src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // グローバルバリデーションパイプ
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTOに定義されていないプロパティを削除
      forbidNonWhitelisted: true, // 不明なプロパティがあればエラー
      transform: true, // 型変換を自動実行
    }),
  );

  await app.listen(3000);
}
```

---

## エラーハンドリング

### Exception Filter（グローバル）

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

    // エラーログ
    this.logger.error('HTTPエラー', {
      status,
      response: exceptionResponse,
    });

    // エラーレスポンス
    const errorResponse = {
      error: {
        code:
          typeof exceptionResponse === 'object' && 'code' in exceptionResponse
            ? exceptionResponse['code']
            : 'RR0999',
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse['message'] || 'システムエラーが発生しました',
        details:
          typeof exceptionResponse === 'object' && 'details' in exceptionResponse
            ? exceptionResponse['details']
            : {},
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

**グローバルフィルター登録:**

```typescript
// src/main.ts
import { HttpExceptionFilter } from './presenter/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // グローバルException Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
```

---

## テスタビリティ

### UseCaseのユニットテスト

```typescript
// src/usecase/webhook/process-webhook.usecase.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ProcessWebhookUseCase } from './process-webhook.usecase';
import {
  IRewardRepository,
  REWARD_REPOSITORY,
} from '../../domain/reward/reward.repository.interface';
import {
  ICoinRepository,
  COIN_REPOSITORY,
} from '../../domain/coin/coin.repository.interface';

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase;
  let rewardRepository: jest.Mocked<IRewardRepository>;
  let coinRepository: jest.Mocked<ICoinRepository>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    // モックRepositoryを作成
    const mockRewardRepository: jest.Mocked<IRewardRepository> = {
      findById: jest.fn(),
      findByMediaCashbackId: jest.fn(),
      save: jest.fn(),
    };

    const mockCoinRepository: jest.Mocked<ICoinRepository> = {
      incrementBalance: jest.fn(),
    };

    // モックDataSource
    const mockDataSource = {
      transaction: jest.fn((callback) => callback({})), // トランザクションを即座に実行
    } as any;

    // テストモジュール作成
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessWebhookUseCase,
        {
          provide: REWARD_REPOSITORY,
          useValue: mockRewardRepository, // モックを注入
        },
        {
          provide: COIN_REPOSITORY,
          useValue: mockCoinRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get<ProcessWebhookUseCase>(ProcessWebhookUseCase);
    rewardRepository = module.get(REWARD_REPOSITORY);
    coinRepository = module.get(COIN_REPOSITORY);
    dataSource = module.get(DataSource);
  });

  describe('execute', () => {
    it('正常系: Webhookを処理してコインを付与する', async () => {
      // Arrange
      const payload = {
        user_id: 12345,
        campaign_id: 1,
        media_cashback_id: 'test-cb-001',
        media_cashback_code: 'TEST12345678901',
        incentive_points: 100,
      };

      rewardRepository.findByMediaCashbackId.mockResolvedValue(null); // 重複なし

      // Act
      await useCase.execute(payload as any);

      // Assert
      expect(rewardRepository.findByMediaCashbackId).toHaveBeenCalledWith('test-cb-001');
      expect(rewardRepository.save).toHaveBeenCalled();
      expect(coinRepository.incrementBalance).toHaveBeenCalledWith(12345, 100);
    });

    it('異常系: 重複したmedia_cashback_idの場合はスキップする', async () => {
      // Arrange
      const payload = {
        media_cashback_id: 'test-cb-001',
      };

      const existingReward = { id: 1 }; // 既存データ
      rewardRepository.findByMediaCashbackId.mockResolvedValue(existingReward as any);

      // Act
      await useCase.execute(payload as any);

      // Assert
      expect(rewardRepository.save).not.toHaveBeenCalled(); // 保存されない
      expect(coinRepository.incrementBalance).not.toHaveBeenCalled(); // コイン更新もされない
    });
  });
});
```

**ポイント:**
- ✅ `Test.createTestingModule()` でテストモジュール作成
- ✅ モックRepositoryを`useValue`で注入
- ✅ `jest.fn()` でモック関数作成
- ✅ `mockResolvedValue()` で戻り値を設定

---

## モジュール全体構成例

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './infrastructure/database/database.module';
import { WebhookModule } from './usecase/webhook/webhook.module';
import { WebhookHttpModule } from './presenter/http/webhook/webhook-http.module';

@Module({
  imports: [
    // 環境変数
    ConfigModule.forRoot({
      isGlobal: true, // 全モジュールで使用可能
      envFilePath: '.env',
    }),

    // TypeORM接続
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // 本番では必ずfalse
    }),

    // アプリケーションモジュール
    DatabaseModule,      // Infrastructure層
    WebhookModule,       // UseCase層
    WebhookHttpModule,   // Presenter層
  ],
})
export class AppModule {}
```

---

## 参考リンク

- [CLAUDE.md](./CLAUDE.md) - コーディング規約
- [TYPEORM_GUIDE.md](./TYPEORM_GUIDE.md) - TypeORM実装パターン
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Clean Architecture設計
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - エラーハンドリング
- [NestJS公式ドキュメント](https://docs.nestjs.com/)

---

**最終更新日**: 2026-02-16
