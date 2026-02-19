import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * CoinTransactionSchema - コイン取引履歴（TypeORMスキーマ）
 *
 * Infrastructure層のORMスキーマ。
 * Domain層の CoinTransaction エンティティとMapperで相互変換する。
 */
@Entity('reci_toku_coin_transactions')
@Index('idx_user_id', ['userId'])
@Index('idx_media_cashback_id', ['mediaCashbackId'])
@Index('idx_created_at', ['createdAt'])
@Index('idx_user_created', ['userId', 'createdAt'])
@Index('idx_transaction_type', ['transactionType'])
export class CoinTransactionSchema {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, comment: '取引ID' })
  id!: string;

  @Column({ type: 'int', name: 'user_id', comment: 'ママリユーザーID' })
  userId!: number;

  @Column({ type: 'int', name: 'amount', comment: 'コイン増減量（正=付与、負=消費）' })
  amount!: number;

  @Column({ type: 'int', name: 'balance_after', comment: '取引後残高' })
  balanceAfter!: number;

  @Column({ type: 'tinyint', name: 'transaction_type', comment: '1:報酬, 2:交換, 3:失効' })
  transactionType!: number;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'reward_id',
    comment: 'receipt_reward_rewards.id（報酬時のみ）',
  })
  rewardId!: string | null;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    name: 'media_cashback_id',
    comment: 'PMN取引ID（調査用）',
  })
  mediaCashbackId!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'description',
    comment: 'ユーザー向け説明文',
  })
  description!: string | null;

  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '記帳日時（UTC）',
  })
  createdAt!: Date;
}
