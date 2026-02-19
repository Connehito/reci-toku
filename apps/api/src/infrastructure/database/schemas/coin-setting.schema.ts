import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * CoinSettingSchema - システム設定（TypeORMスキーマ）
 *
 * Infrastructure層のORMスキーマ。
 * Domain層の CoinSetting エンティティとMapperで相互変換する。
 */
@Entity('reci_toku_coin_settings')
export class CoinSettingSchema {
  @PrimaryColumn({ type: 'varchar', length: 64, name: 'key', comment: '設定キー' })
  key!: string;

  @Column({ type: 'varchar', length: 255, name: 'value', comment: '設定値' })
  value!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'description',
    comment: '設定の説明',
  })
  description!: string | null;

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
}
