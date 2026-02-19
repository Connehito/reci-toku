import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

/**
 * UserCoinSchema - ユーザーコイン残高（TypeORMスキーマ）
 *
 * Infrastructure層のORMスキーマ。
 * Domain層の UserCoin エンティティとMapperで相互変換する。
 */
@Entity('reci_toku_user_coins')
@Index('idx_last_earned_at', ['lastEarnedAt'])
@Index('idx_last_earned_balance', ['lastEarnedAt', 'currentBalance'])
export class UserCoinSchema {
  @PrimaryColumn({ type: 'int', name: 'user_id', comment: 'ママリユーザーID' })
  userId!: number;

  @Column({ type: 'int', name: 'current_balance', default: 0, comment: '現在残高' })
  currentBalance!: number;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'last_earned_at',
    comment: '最終獲得日時（有効期限基準）',
  })
  lastEarnedAt!: Date | null;

  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '初回獲得日時（UTC）',
  })
  createdAt!: Date;

  @Column({
    type: 'datetime',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '最終更新日時（UTC）',
  })
  updatedAt!: Date;
}
