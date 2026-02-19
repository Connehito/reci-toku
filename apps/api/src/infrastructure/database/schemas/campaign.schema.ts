import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * CampaignSchema - キャンペーンマスタ（TypeORMスキーマ）
 *
 * Infrastructure層のORMスキーマ。
 * Domain層の Campaign エンティティとMapperで相互変換する。
 */
@Entity('reci_toku_campaigns')
@Index('idx_published', ['isPublished', 'publishedAt'])
@Index('idx_display_order', ['displayOrder'])
@Index('idx_service_type', ['serviceType'])
@Index('idx_active_sort', ['isPublished', 'displayOrder'])
export class CampaignSchema {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  // ========================================
  // WED/ONE基本情報（Webhookペイロード由来）
  // ========================================
  @Column({
    type: 'varchar',
    length: 36,
    name: 'receipt_campaign_id',
    unique: true,
    comment: 'WED/ONEのキャンペーンUUID',
  })
  receiptCampaignId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'receipt_campaign_name',
    comment: 'WED側キャンペーン名（参照用）',
  })
  receiptCampaignName!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'receipt_campaign_image',
    comment: 'WED側サムネイルURL（参照用）',
  })
  receiptCampaignImage!: string | null;

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
    length: 36,
    nullable: true,
    name: 'company_id',
    comment: '主催企業UUID',
  })
  companyId!: string | null;

  @Column({ type: 'int', name: 'incentive_points', comment: '付与ポイント数' })
  incentivePoints!: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'service_type',
    comment: 'サービス種別（receipt:なんでもレシート, mission:ミッション）',
  })
  serviceType!: string;

  // ========================================
  // WED/ONE追加情報（MissionDetail由来、将来のAPI連携用）
  // ========================================
  @Column({
    type: 'tinyint',
    default: 0,
    name: 'is_all_receipt_campaign',
    comment: '全種類（なんでも）レシートか否か（0:特定商品, 1:なんでもOK）',
  })
  isAllReceiptCampaign!: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'mission_type',
    comment: 'ミッション種別（campaign:通常, group:グループ）',
  })
  missionType!: string | null;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'mission_open_at',
    comment: 'WED側の開始時刻（時間帯限定の場合）',
  })
  missionOpenAt!: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'mission_close_at',
    comment: 'WED側の終了時刻（時間帯限定の場合）',
  })
  missionCloseAt!: Date | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'price_text',
    comment: 'UI表示用の金額テキスト（例：最大¥100）',
  })
  priceText!: string | null;

  // ========================================
  // ママリ側の管理情報
  // ========================================
  @Column({
    type: 'varchar',
    length: 255,
    name: 'title',
    comment: 'ママリで表示するタイトル（編集可能）',
  })
  title!: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'description',
    comment: 'ママリで表示する説明文（編集可能）',
  })
  description!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'image_url',
    comment: 'ママリで表示する画像URL（編集可能）',
  })
  imageUrl!: string | null;

  @Column({ type: 'int', default: 0, name: 'display_order', comment: '表示順序（小さい順に表示）' })
  displayOrder!: number;

  @Column({
    type: 'tinyint',
    default: 0,
    name: 'is_published',
    comment: '公開フラグ（1:公開, 0:非公開）',
  })
  isPublished!: number;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'published_at',
    comment: 'ママリでの公開開始日時（期間限定キャンペーン用）',
  })
  publishedAt!: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'unpublished_at',
    comment: 'ママリでの公開終了日時（自動非公開用）',
  })
  unpublishedAt!: Date | null;

  // ========================================
  // キュレーション情報
  // ========================================
  @Column({
    type: 'text',
    nullable: true,
    name: 'editor_comment',
    comment: '編集部コメント（ユーザー向け説明文）',
  })
  editorComment!: string | null;

  @Column({
    type: 'json',
    nullable: true,
    name: 'tags',
    comment: 'タグ配列（例：["おすすめ", "高ポイント", "期間限定"]）',
  })
  tags!: string[] | null;

  // ========================================
  // メタデータ
  // ========================================
  @Column({
    type: 'datetime',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '作成日時（UTC）',
  })
  createdAt!: Date;

  @Column({
    type: 'datetime',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '更新日時（UTC）',
  })
  updatedAt!: Date;

  @Column({ type: 'int', nullable: true, name: 'created_by', comment: '登録者のuser_id' })
  createdBy!: number | null;

  @Column({ type: 'int', nullable: true, name: 'updated_by', comment: '更新者のuser_id' })
  updatedBy!: number | null;
}
