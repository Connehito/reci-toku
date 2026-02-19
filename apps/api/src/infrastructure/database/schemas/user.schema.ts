import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * UserSchema - 既存ママリユーザーテーブル（TypeORMスキーマ）
 *
 * Infrastructure層のORMスキーマ。
 * 既存のmamariq.usersテーブルに対応（接続テスト用）
 * 実際のテーブル構造は簡略化しています。
 */
@Entity('users')
export class UserSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string;

  @Column({ type: 'datetime', name: 'created' })
  createdAt!: Date;

  @Column({ type: 'datetime', name: 'modified' })
  updatedAt!: Date;
}
