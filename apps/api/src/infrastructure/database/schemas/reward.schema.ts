import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * RewardSchema - 報酬履歴（TypeORMスキーマ）
 *
 * Infrastructure層のORMスキーマ。
 * Domain層の Reward エンティティとMapperで相互変換する。
 */
@Entity('reci_toku_rewards')
@Index('idx_user_id', ['userId'])
@Index('idx_campaign_id', ['campaignId'])
@Index('idx_receipt_campaign_id', ['receiptCampaignId'])
@Index('idx_created_at', ['createdAt'])
@Index('idx_user_created', ['userId', 'createdAt'])
export class RewardSchema {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'int', name: 'user_id', comment: 'ママリユーザーID（mamariq.usersへの参照）' })
  userId!: number;

  @Column({
    type: 'bigint',
    unsigned: true,
    name: 'campaign_id',
    comment: 'ママリ側キャンペーンID（未登録時はWebhookエラー）',
  })
  campaignId!: string;

  @Column({ type: 'varchar', length: 36, name: 'media_id', comment: 'PMN発行のメディア一意値' })
  mediaId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'media_user_code',
    comment: '復号されたママリUUID',
  })
  mediaUserCode!: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'media_cashback_id',
    unique: true,
    comment: 'PMN発行の取引ID（べき等性キー）',
  })
  mediaCashbackId!: string;

  @Column({
    type: 'varchar',
    length: 15,
    name: 'media_cashback_code',
    comment: '15桁インセンティブID',
  })
  mediaCashbackCode!: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'receipt_campaign_id',
    comment: 'PMN側キャンペーンUUID',
  })
  receiptCampaignId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'receipt_campaign_name',
    comment: 'PMN側キャンペーン名',
  })
  receiptCampaignName!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'receipt_campaign_image',
    comment: 'PMN側キャンペーン画像URL',
  })
  receiptCampaignImage!: string | null;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    name: 'company_id',
    comment: '主催企業ID',
  })
  companyId!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'company_name',
    comment: '主催企業名',
  })
  companyName!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'service_type',
    comment: 'サービス種別（receipt/mission）',
  })
  serviceType!: string | null;

  @Column({
    type: 'int',
    name: 'incentive_points',
    comment: '付与したコイン数（WED API仕様に準拠）',
  })
  incentivePoints!: number;

  @Column({ type: 'datetime', name: 'participation_at', comment: 'レシート投稿時刻（UTC）' })
  participationAt!: Date;

  @Column({ type: 'datetime', name: 'processed_at', comment: 'PMN判定完了時刻（UTC）' })
  processedAt!: Date;

  @Column({
    type: 'text',
    nullable: true,
    name: 'jwe_payload',
    comment: '復号後の全データ生ログ（JSON）',
  })
  jwePayload!: string | null;

  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'ママリ側データ作成日時（UTC）',
  })
  createdAt!: Date;
}
