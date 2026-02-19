# TypeORM実装ガイド（Clean Architecture準拠）

このドキュメントは、Clean Architectureに準拠したTypeORMの実装パターンをまとめたものです。

**TypeORM採用理由**: [ADR - ORM選定（TypeORM vs Prisma）](https://github.com/Connehito/mamari-spec/issues/6461#3-orm選定typeorm-vs-prisma)

---

## 目次

1. [レイヤーごとの責務](#レイヤーごとの責務)
2. [Domain層の実装](#domain層の実装)
3. [Infrastructure層の実装](#infrastructure層の実装)
4. [命名規約](#命名規約)
5. [トランザクション管理](#トランザクション管理)
6. [よくあるパターン](#よくあるパターン)

---

## レイヤーごとの責務

### 依存関係ルール

```
Presenter → UseCase → Domain ← Infrastructure
```

**重要:**
- **Domain層は他のレイヤーに依存しない**（依存性逆転の原則）
- **Infrastructure層はDomain層のInterfaceを実装する**
- **TypeORMの依存はInfrastructure層のみ**

---

## Domain層の実装

Domain層は**Pure TypeScript**で実装し、フレームワークに依存しません。

### 1. Domain Entity（ドメインモデル）

**ファイル配置:**
```
src/domain/reward/reward.entity.ts
```

**実装例:**

```typescript
// src/domain/reward/reward.entity.ts

/**
 * 報酬ドメインエンティティ
 *
 * フレームワーク非依存（Pure TypeScript）
 * ビジネスルール・バリデーションを持つ
 */
export class Reward {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly campaignId: number,
    public readonly mediaCashbackId: string,
    public readonly mediaCashbackCode: string,
    public readonly incentivePoints: number,
    public readonly createdAt: Date,
  ) {
    // ビジネスルールのバリデーション
    if (incentivePoints <= 0) {
      throw new Error('付与コイン数は1以上である必要があります');
    }
  }

  /**
   * ファクトリメソッド - 新規作成
   */
  static create(props: {
    userId: number;
    campaignId: number;
    mediaCashbackId: string;
    mediaCashbackCode: string;
    incentivePoints: number;
  }): Reward {
    return new Reward(
      0, // idはDB保存時に自動採番
      props.userId,
      props.campaignId,
      props.mediaCashbackId,
      props.mediaCashbackCode,
      props.incentivePoints,
      new Date(),
    );
  }

  /**
   * ファクトリメソッド - DB取得データから復元
   */
  static reconstruct(props: {
    id: number;
    userId: number;
    campaignId: number;
    mediaCashbackId: string;
    mediaCashbackCode: string;
    incentivePoints: number;
    createdAt: Date;
  }): Reward {
    return new Reward(
      props.id,
      props.userId,
      props.campaignId,
      props.mediaCashbackId,
      props.mediaCashbackCode,
      props.incentivePoints,
      props.createdAt,
    );
  }

  /**
   * ビジネスロジック: 報酬が有効か判定
   */
  isValid(): boolean {
    return this.incentivePoints > 0;
  }
}
```

**ポイント:**
- ✅ TypeORMの`@Entity`デコレータは使わない
- ✅ privateコンストラクタ + ファクトリメソッド
- ✅ `create()`: 新規作成用
- ✅ `reconstruct()`: DB取得データから復元用
- ✅ ビジネスルール・バリデーションをメソッドとして持つ

---

### 2. Repository Interface（リポジトリインターフェース）

**ファイル配置:**
```
src/domain/reward/reward.repository.interface.ts
```

**実装例:**

```typescript
// src/domain/reward/reward.repository.interface.ts
import { Reward } from './reward.entity';

/**
 * 報酬リポジトリインターフェース
 *
 * Domain層で定義し、Infrastructure層で実装する（DIP）
 */
export interface IRewardRepository {
  /**
   * IDで検索
   */
  findById(id: number): Promise<Reward | null>;

  /**
   * media_cashback_idで検索（べき等性チェック用）
   */
  findByMediaCashbackId(mediaCashbackId: string): Promise<Reward | null>;

  /**
   * ユーザーの報酬履歴を取得
   */
  findByUserId(
    userId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<Reward[]>;

  /**
   * 保存（新規作成・更新）
   */
  save(reward: Reward): Promise<Reward>;

  /**
   * 削除
   */
  delete(id: number): Promise<void>;
}
```

**ポイント:**
- ✅ Pure TypeScript（フレームワーク非依存）
- ✅ 戻り値は**Domain Entity**（TypeORM Entityではない）
- ✅ データ永続化の詳細は隠蔽

---

## Infrastructure層の実装

Infrastructure層でTypeORMに依存した実装を行います。

### 1. TypeORM Entity（データベースエンティティ）

**ファイル配置:**
```
src/infrastructure/database/entities/reward.entity.ts
```

**実装例:**

```typescript
// src/infrastructure/database/entities/reward.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * 報酬テーブル（TypeORM Entity）
 *
 * Infrastructure層のみで使用
 * Domain Entityとは別物
 */
@Entity('receipt_reward_rewards')
@Index('idx_user_id', ['userId'])
@Index('idx_campaign_id', ['campaignId'])
@Index('uk_media_cashback_id', ['mediaCashbackId'], { unique: true })
export class RewardEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    comment: 'ママリ内部の管理用ID',
  })
  id: number;

  @Column({
    type: 'int',
    name: 'user_id',
    comment: 'ママリユーザーID',
  })
  @Index('idx_user_id')
  userId: number;

  @Column({
    type: 'bigint',
    unsigned: true,
    name: 'campaign_id',
    comment: 'ママリ側キャンペーンID',
  })
  @Index('idx_campaign_id')
  campaignId: number;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'media_id',
    comment: 'PMN発行のメディア一意値',
  })
  mediaId: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'media_user_code',
    comment: '復号されたママリUUID',
  })
  mediaUserCode: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'media_cashback_id',
    unique: true,
    comment: 'PMN発行の取引ID（べき等性キー）',
  })
  @Index('uk_media_cashback_id', { unique: true })
  mediaCashbackId: string;

  @Column({
    type: 'varchar',
    length: 15,
    name: 'media_cashback_code',
    comment: '15桁インセンティブID',
  })
  mediaCashbackCode: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'receipt_campaign_id',
    comment: 'PMN側キャンペーンUUID',
  })
  @Index('idx_receipt_campaign_id')
  receiptCampaignId: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'receipt_campaign_name',
    nullable: true,
    comment: 'PMN側キャンペーン名',
  })
  receiptCampaignName: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'receipt_campaign_image',
    nullable: true,
    comment: 'PMN側キャンペーン画像URL',
  })
  receiptCampaignImage: string | null;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'company_id',
    nullable: true,
    comment: '主催企業ID',
  })
  companyId: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'company_name',
    nullable: true,
    comment: '主催企業名',
  })
  companyName: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'service_type',
    nullable: true,
    comment: 'サービス種別（receipt/mission）',
  })
  serviceType: string | null;

  @Column({
    type: 'int',
    name: 'incentive_points',
    comment: '付与したコイン数',
  })
  incentivePoints: number;

  @Column({
    type: 'datetime',
    name: 'participation_at',
    comment: 'レシート投稿時刻（UTC）',
  })
  participationAt: Date;

  @Column({
    type: 'datetime',
    name: 'processed_at',
    comment: 'PMN判定完了時刻（UTC）',
  })
  processedAt: Date;

  @Column({
    type: 'text',
    name: 'jwe_payload',
    nullable: true,
    comment: '復号後の全データ生ログ（JSON）',
  })
  jwePayload: string | null;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    comment: 'ママリ側データ作成日時（UTC）',
  })
  createdAt: Date;
}
```

**ポイント:**
- ✅ テーブル名: snake_case（`receipt_reward_rewards`）
- ✅ カラム名: snake_case（`name` オプションで指定）
- ✅ プロパティ名: camelCase（TypeScript慣例）
- ✅ インデックスをデコレータで定義
- ✅ コメントで説明を追加

---

### 2. Repository Implementation（リポジトリ実装）

**ファイル配置:**
```
src/infrastructure/database/repositories/reward.repository.ts
```

**実装例:**

```typescript
// src/infrastructure/database/repositories/reward.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository } from '../../../domain/reward/reward.repository.interface';
import { Reward } from '../../../domain/reward/reward.entity';
import { RewardEntity } from '../entities/reward.entity';

/**
 * 報酬リポジトリ実装
 *
 * Infrastructure層でDomain層のInterfaceを実装
 */
@Injectable()
export class RewardRepository implements IRewardRepository {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly repository: Repository<RewardEntity>,
  ) {}

  /**
   * IDで検索
   */
  async findById(id: number): Promise<Reward | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * media_cashback_idで検索（べき等性チェック用）
   */
  async findByMediaCashbackId(mediaCashbackId: string): Promise<Reward | null> {
    const entity = await this.repository.findOne({
      where: { mediaCashbackId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * ユーザーの報酬履歴を取得
   */
  async findByUserId(
    userId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<Reward[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: options?.limit,
      skip: options?.offset,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * 保存（新規作成・更新）
   */
  async save(reward: Reward): Promise<Reward> {
    const entity = this.toEntity(reward);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  /**
   * 削除
   */
  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * TypeORM Entity → Domain Entity 変換
   */
  private toDomain(entity: RewardEntity): Reward {
    return Reward.reconstruct({
      id: entity.id,
      userId: entity.userId,
      campaignId: entity.campaignId,
      mediaCashbackId: entity.mediaCashbackId,
      mediaCashbackCode: entity.mediaCashbackCode,
      incentivePoints: entity.incentivePoints,
      createdAt: entity.createdAt,
    });
  }

  /**
   * Domain Entity → TypeORM Entity 変換
   */
  private toEntity(domain: Reward): RewardEntity {
    const entity = new RewardEntity();
    if (domain.id !== 0) {
      entity.id = domain.id; // 更新時のみ設定
    }
    entity.userId = domain.userId;
    entity.campaignId = domain.campaignId;
    entity.mediaCashbackId = domain.mediaCashbackId;
    entity.mediaCashbackCode = domain.mediaCashbackCode;
    entity.incentivePoints = domain.incentivePoints;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
```

**ポイント:**
- ✅ `IRewardRepository` インターフェースを実装
- ✅ `toDomain()`: TypeORM Entity → Domain Entity
- ✅ `toEntity()`: Domain Entity → TypeORM Entity
- ✅ 戻り値は常に**Domain Entity**
- ✅ TypeORMの詳細はこのクラス内に隠蔽

---

## 命名規約

### ファイル名

| レイヤー | ファイル名 | 例 |
|---------|-----------|-----|
| Domain Entity | `<名前>.entity.ts` | `reward.entity.ts` |
| Repository Interface | `<名前>.repository.interface.ts` | `reward.repository.interface.ts` |
| TypeORM Entity | `<名前>.entity.ts` | `reward.entity.ts` |
| Repository Implementation | `<名前>.repository.ts` | `reward.repository.ts` |

### クラス名

| レイヤー | クラス名 | 例 |
|---------|---------|-----|
| Domain Entity | `<名前>` | `Reward` |
| Repository Interface | `I<名前>Repository` | `IRewardRepository` |
| TypeORM Entity | `<名前>Entity` | `RewardEntity` |
| Repository Implementation | `<名前>Repository` | `RewardRepository` |

### ディレクトリ構成

```
src/
├── domain/
│   └── reward/
│       ├── reward.entity.ts                    # Domain Entity
│       └── reward.repository.interface.ts      # Repository Interface
├── infrastructure/
│   └── database/
│       ├── entities/
│       │   └── reward.entity.ts                # TypeORM Entity
│       └── repositories/
│           └── reward.repository.ts            # Repository Implementation
├── usecase/
│   └── webhook/
│       └── process-webhook.usecase.ts
└── presenter/
    └── http/
        └── webhook/
            └── webhook.controller.ts
```

---

## トランザクション管理

### パターン1: UseCaseでトランザクション制御

**推奨パターン**

```typescript
// src/usecase/webhook/process-webhook.usecase.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProcessWebhookUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rewardRepository: IRewardRepository,
    private readonly coinRepository: ICoinRepository,
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    // トランザクション開始
    await this.dataSource.transaction(async (manager) => {
      // 1. Reward保存
      const reward = Reward.create({ /* ... */ });
      await this.rewardRepository.save(reward);

      // 2. Coin残高更新
      await this.coinRepository.updateBalance(userId, amount);

      // 3. Transaction記録
      const transaction = CoinTransaction.create({ /* ... */ });
      await this.transactionRepository.save(transaction);

      // すべて成功した場合のみコミット
      // エラーが発生した場合は自動ロールバック
    });
  }
}
```

### パターン2: Repositoryでトランザクション対応

```typescript
// src/infrastructure/database/repositories/reward.repository.ts
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class RewardRepository implements IRewardRepository {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly repository: Repository<RewardEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * トランザクション内で保存
   */
  async save(reward: Reward, manager?: EntityManager): Promise<Reward> {
    const entity = this.toEntity(reward);

    // トランザクションマネージャーが渡された場合はそれを使用
    const repo = manager
      ? manager.getRepository(RewardEntity)
      : this.repository;

    const savedEntity = await repo.save(entity);
    return this.toDomain(savedEntity);
  }
}
```

**ポイント:**
- ✅ UseCaseでトランザクション境界を制御
- ✅ `DataSource.transaction()` を使用
- ✅ エラー時は自動ロールバック

---

## よくあるパターン

### パターン1: ページネーション

```typescript
// Repository
async findByUserId(
  userId: number,
  page: number,
  limit: number,
): Promise<{ items: Reward[]; total: number }> {
  const [entities, total] = await this.repository.findAndCount({
    where: { userId },
    order: { createdAt: 'DESC' },
    take: limit,
    skip: (page - 1) * limit,
  });

  return {
    items: entities.map((e) => this.toDomain(e)),
    total,
  };
}
```

### パターン2: 複雑な検索条件

```typescript
// Repository
async findByCriteria(criteria: {
  userId?: number;
  campaignId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<Reward[]> {
  const qb = this.repository.createQueryBuilder('reward');

  if (criteria.userId) {
    qb.andWhere('reward.userId = :userId', { userId: criteria.userId });
  }

  if (criteria.campaignId) {
    qb.andWhere('reward.campaignId = :campaignId', {
      campaignId: criteria.campaignId,
    });
  }

  if (criteria.startDate) {
    qb.andWhere('reward.createdAt >= :startDate', {
      startDate: criteria.startDate,
    });
  }

  if (criteria.endDate) {
    qb.andWhere('reward.createdAt <= :endDate', {
      endDate: criteria.endDate,
    });
  }

  const entities = await qb.getMany();
  return entities.map((e) => this.toDomain(e));
}
```

### パターン3: アトミック更新

```typescript
// Repository
async incrementBalance(userId: number, amount: number): Promise<void> {
  await this.repository
    .createQueryBuilder()
    .update('receipt_reward_user_coins')
    .set({
      currentBalance: () => `current_balance + ${amount}`,
      lastEarnedAt: new Date(),
    })
    .where('user_id = :userId', { userId })
    .execute();
}
```

---

## やってはいけないこと

### ❌ Domain層でTypeORMに依存

```typescript
// ❌ NG: Domain Entityに@Entityデコレータ
import { Entity } from 'typeorm'; // NG!

@Entity() // NG!
export class Reward {
  // ...
}
```

### ❌ UseCaseでTypeORM Entityを直接使用

```typescript
// ❌ NG: UseCaseでTypeORM Entityを参照
import { RewardEntity } from '../../infrastructure/database/entities/reward.entity'; // NG!

export class ProcessWebhookUseCase {
  async execute() {
    const entity = new RewardEntity(); // NG!
  }
}
```

### ❌ Repository Interfaceで具体的な実装に依存

```typescript
// ❌ NG: InterfaceでTypeORMの型を使用
import { Repository } from 'typeorm'; // NG!

export interface IRewardRepository {
  getRepository(): Repository<RewardEntity>; // NG!
}
```

---

## 参考リンク

- [CLAUDE.md](./CLAUDE.md) - コーディング規約
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Clean Architecture設計
- [DATABASE.md](./DATABASE.md) - データベース設計
- [NESTJS_PATTERNS.md](./NESTJS_PATTERNS.md) - NestJSパターン

---

**最終更新日**: 2026-02-16
