# レシートリワード - データベース設計書

このドキュメントは、レシートリワードシステムのデータベーススキーマ定義、命名規則、ユースケースごとの更新パターンをまとめたものです。

**関連ドキュメント:**
- [アーキテクチャ設計書（ARCHITECTURE.md）](./ARCHITECTURE.md)
- [開発ガイド（CLAUDE.md）](./CLAUDE.md)

---

## 目次

1. [想定データ量](#想定データ量)
2. [命名規則](#命名規則)
3. [テーブル定義](#テーブル定義)
4. [ユースケース別更新パターン](#ユースケース別更新パターン)

---

## 想定データ量

### ユーザー規模

- **DAU（Daily Active Users）**: 最大50,000人（既存ママリアプリのDAU）
- **MAU（Monthly Active Users）**: 推定100,000〜150,000人
- **想定獲得頻度**: 1人あたり1日1回程度

### 年間データ量の試算

**トランザクション系テーブル:**

| テーブル | 年間レコード数 | 5年後 | 備考 |
| --- | --- | --- | --- |
| `reci_toku_rewards` | 約1,800万レコード | 約9,000万レコード | Webhook受信履歴 |
| `reci_toku_coin_transactions` | 約1,800万レコード | 約9,000万レコード | 付与・消費・失効の全履歴 |
| `reci_toku_user_coins` | 最大50,000レコード | 最大100,000レコード | ユーザー数分のみ |
| `reci_toku_campaigns` | 数十〜数百レコード | 数百〜数千レコード | キャンペーンマスタ |
| `reci_toku_coin_settings` | 数レコード | 数レコード | システム設定 |

**計算根拠:**
```
DAU: 50,000人/日
獲得頻度: 1回/人/日
年間獲得: 50,000 × 365 = 18,250,000 ≈ 1,800万レコード
```

**ストレージ試算（5年後）:**
```
reci_toku_rewards: 約9,000万レコード × 約2KB = 約180GB
reci_toku_coin_transactions: 約9,000万レコード × 約500B = 約45GB
合計: 約225GB（インデックス含めると約400GB程度）
```

### 設計判断の妥当性

**この規模では現在の設計が最適:**

| 項目 | 判断 | 理由 |
| --- | --- | --- |
| **UUID保存形式** | VARCHAR(36) ✅ | 可読性重視。BINARY(16)への最適化は数年後で十分 |
| **失効バッチサイズ** | 1000件/バッチ ✅ | 最大50バッチ（数分で完了）。DB負荷も適切 |
| **インデックス** | 現状で十分 ✅ | 億レコードまで効率的に機能 |
| **パーティショニング** | 不要 ✅ | 5年後でも数億レコード。適切なインデックスで対応可能 |
| **楽観的ロック** | 不要 ✅ | 同一ユーザーへの同時Webhook受信はほぼ発生しない |
| **コイン有効期限** | 全残高一括延長 ✅ | シンプルで十分。個別ロット管理は過剰 |

### パフォーマンス想定

**ピーク時の負荷:**
```
夕方ピーク: DAUの20%が1時間に集中すると仮定
= 10,000人/時 = 約3件/秒のWebhook

→ MySQL 8.0 + 適切なインデックスで余裕で処理可能
```

**クエリ性能:**
```
ユーザー履歴取得: idx_user_created (user_id, created_at)
→ 50,000ユーザー × 年間365レコード = 1レコード検索は瞬時

失効バッチ: idx_last_earned_balance (last_earned_at, current_balance)
→ 1000件抽出は1秒未満
```

---

## 命名規則

### テーブル名プレフィックス

**全テーブルに `reci_toku_` プレフィックスを必須とする理由:**

- 将来のDB分離時に `reci_toku_*` テーブルのみをエクスポートすれば分離可能
- 既存テーブル（users, coins等）との命名衝突を回避
- 権限管理が容易（`GRANT SELECT ON mamariq.reci_toku_% TO 'app_user'@'%'`）
- 監視・メトリクスのグルーピングが容易

**命名例:**

```sql
✅ Good
reci_toku_campaigns
reci_toku_user_coins
reci_toku_coin_transactions
reci_toku_rewards

❌ Bad（プレフィックスなし）
campaigns          -- 既存テーブルと衝突リスク
user_coins         -- ママリの他機能と混在
coin_transactions  -- どの機能か不明
```

### 外部キー制約のポリシー

**usersテーブルへの外部キー制約は貼らない**

```sql
✅ Good: FK制約なし
CREATE TABLE reci_toku_user_coins (
  user_id INT NOT NULL COMMENT 'ママリユーザーID（mamariq.usersへの参照）',
  balance INT NOT NULL,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

❌ Bad: FK制約あり（将来の分離時に問題）
CREATE TABLE reci_toku_user_coins (
  user_id INT NOT NULL,
  balance INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

**理由:**

- 将来のDB分離時に `ON DELETE CASCADE` 等の制約が障害になる
- アプリケーション層（Clean Architectureのドメイン層）で整合性を保証

詳細は [ADR：なぜNest.js(Clean Architecture) + Next.jsを選んだか](https://github.com/Connehito/mamari-spec/issues/6461)の「5. Database戦略：同居 vs 分離」を参照。

### タイムゾーン戦略

**全DatetimeカラムはUTC保存を統一**

- Performance Media NetworkからはJST（+09:00）でタイムスタンプが送信される
- Nest.js側でUTCに変換してDB保存
- フロントエンド表示時にユーザーのタイムゾーン（JST）で変換

### コイン有効期限の仕様

**全残高一括延長方式を採用**

`reci_toku_user_coins.last_earned_at`（最終獲得日）を基準に、ユーザーの**全コイン残高の有効期限を一括管理**します。

**仕組み:**
```
ユーザーがコインを獲得するたびに:
1. current_balance += 獲得コイン数
2. last_earned_at = 現在日時（更新）

→ 既存のコインも含めて、全残高の有効期限が延長される
```

**例:**
```
1月1日: 100コイン獲得 → 有効期限 7月1日（6ヶ月後）
3月1日: 50コイン獲得  → 有効期限 9月1日に延長（既存100コインも含む全150コインが9月1日まで）
```

**この方式を選んだ理由:**
- ✅ 実装がシンプル（1カラムで管理）
- ✅ ユーザーにとってわかりやすい（「最後に獲得してから6ヶ月」）
- ✅ アクティブユーザーのコインは実質無期限
- ✅ パフォーマンスが良い（ロット管理不要）

**採用しなかった方式（FIFO/個別ロット管理）:**
```sql
-- 各コイン獲得に個別の有効期限を持たせる方式
CREATE TABLE reci_toku_coin_lots (
  id BIGINT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  remaining INT NOT NULL,
  expires_at DATETIME NOT NULL,  -- 個別の有効期限
  ...
);
```
- ❌ 実装が複雑（消費時のFIFO処理が必要）
- ❌ パフォーマンス懸念（大量のロットレコード）
- ❌ ユーザーにとって理解しづらい

---

## テーブル定義

### 1. reci_toku_rewards（報酬・履歴管理）

Performance Media Network（PMN）からの通知をそのまま記録する「証跡」テーブルです。

愚直に主要データを保存しつつ、payloadのjsonもそのまま保存します。

よく使いそうなデータ、管理画面に表示しそうなデータは毎度jsonから取り出すのではなく個別に保存します。

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `id` | BIGINT | PK / AI | ママリ内部の管理用ID |
| `user_id` | INT | FK / Index | 既存Users.id。`media_user_code`（UUID）から逆引きした連番ID |
| `campaign_id` | BIGINT | **NOT NULL** / FK / Index | ママリ側の `reci_toku_campaigns.id`。`receipt_campaign_id` から逆引き。未登録の場合はWebhookをエラーにする |
| **`media_id`** | VARCHAR(36) | NOT NULL | PMN発行のメディア一意値 |
| **`media_user_code`** | VARCHAR(255) | Index | 復号されたママリのUUIDをそのまま保持 |
| **`media_cashback_id`** | VARCHAR(36) | **UNIQUE** | **PMN発行の取引ID**。二重付与防止の最強のキー |
| **`media_cashback_code`** | VARCHAR(15) | NOT NULL | 15桁の英数字インセンティブID（例：oGtGV4JZC5qJByA） |
| **`receipt_campaign_id`** | VARCHAR(36) | Index | **PMN側のキャンペーンUUID** |
| **`receipt_campaign_name`** | VARCHAR(255) | - | PMN側のキャンペーン名（履歴表示用） |
| **`receipt_campaign_image`** | VARCHAR(255) | - | PMN側のキャンペーン画像URL |
| **`company_id`** | VARCHAR(36) | - | 主催企業ID（P&G等） |
| **`company_name`** | VARCHAR(255) | - | 主催企業名 |
| **`service_type`** | VARCHAR(20) | - | サービス種別（receipt/mission） |
| **`incentive_points`** | INT | NOT NULL | 付与したコイン数（WED API仕様に準拠） |
| **`participation_at`** | DATETIME | NOT NULL | ユーザーがレシートを投稿した時刻（UTC） |
| **`processed_at`** | DATETIME | NOT NULL | PMN側での判定完了時刻（UTC） |
| `jwe_payload` | TEXT (JSON) | - | 万が一のための、復号後の全データ生ログ |
| `created_at` | DATETIME | NOT NULL | ママリ側でのデータ作成（付与実行）日時（UTC） |

**スキーマ定義:**

```sql
CREATE TABLE reci_toku_rewards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'ママリユーザーID（mamariq.usersへの参照）',
  campaign_id BIGINT UNSIGNED NOT NULL COMMENT 'ママリ側キャンペーンID（未登録時はWebhookエラー）',
  media_id VARCHAR(36) NOT NULL COMMENT 'PMN発行のメディア一意値',
  media_user_code VARCHAR(255) NOT NULL COMMENT '復号されたママリUUID',
  media_cashback_id VARCHAR(36) NOT NULL COMMENT 'PMN発行の取引ID（べき等性キー）',
  media_cashback_code VARCHAR(15) NOT NULL COMMENT '15桁インセンティブID',
  receipt_campaign_id VARCHAR(36) NOT NULL COMMENT 'PMN側キャンペーンUUID',
  receipt_campaign_name VARCHAR(255) COMMENT 'PMN側キャンペーン名',
  receipt_campaign_image VARCHAR(255) COMMENT 'PMN側キャンペーン画像URL',
  company_id VARCHAR(36) COMMENT '主催企業ID',
  company_name VARCHAR(255) COMMENT '主催企業名',
  service_type VARCHAR(20) COMMENT 'サービス種別（receipt/mission）',
  incentive_points INT NOT NULL COMMENT '付与したコイン数（WED API仕様に準拠）',
  participation_at DATETIME NOT NULL COMMENT 'レシート投稿時刻（UTC）',
  processed_at DATETIME NOT NULL COMMENT 'PMN判定完了時刻（UTC）',
  jwe_payload TEXT COMMENT '復号後の全データ生ログ（JSON）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'ママリ側データ作成日時（UTC）',
  INDEX idx_user_id (user_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_receipt_campaign_id (receipt_campaign_id),
  INDEX idx_created_at (created_at),
  INDEX idx_user_created (user_id, created_at),
  UNIQUE KEY uk_media_cashback_id (media_cashback_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='報酬履歴（PMN Webhook証跡）';
```

---

### 2. reci_toku_coin_transactions（コイン取引履歴）

「コイン」の増減（付与・交換・失効）をすべて記録する台帳です。

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `id` | BIGINT | PK / AI | 取引一意識別子（自動採番） |
| `user_id` | INT | FK / Index | 既存Users.id |
| `amount` | INT | NOT NULL | コイン増減量（付与は正、交換消費は負） |
| `balance_after` | INT | NOT NULL | **取引後の残高**。不整合の早期発見に重要 |
| `transaction_type` | TINYINT | NOT NULL | 1:レシート報酬, 2:交換申請, 3:有効期限切れ失効 |
| **`reward_id`** | BIGINT | FK / Nullable | **`reci_toku_rewards.id`** への参照。報酬による付与時のみ格納 |
| `media_cashback_id` | VARCHAR(36) | Index | 調査用。PMN側のIDをここにも持たせ、検索を高速化 |
| `description` | VARCHAR(255) | - | ユーザー履歴に表示するテキスト（例：「オムツCP報酬」） |
| `created_at` | DATETIME | NOT NULL | 記帳日時（UTC） |

**スキーマ定義:**

```sql
CREATE TABLE reci_toku_coin_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '取引ID',
  user_id INT NOT NULL COMMENT 'ママリユーザーID',
  amount INT NOT NULL COMMENT 'コイン増減量（正=付与、負=消費）',
  balance_after INT NOT NULL COMMENT '取引後残高',
  transaction_type TINYINT NOT NULL COMMENT '1:報酬, 2:交換, 3:失効',
  reward_id BIGINT UNSIGNED COMMENT 'reci_toku_rewards.id（報酬時のみ）',
  media_cashback_id VARCHAR(36) COMMENT 'PMN取引ID（調査用）',
  description VARCHAR(255) COMMENT 'ユーザー向け説明文',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '記帳日時（UTC）',
  INDEX idx_user_id (user_id),
  INDEX idx_media_cashback_id (media_cashback_id),
  INDEX idx_created_at (created_at),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_transaction_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='コイン取引台帳';
```

---

### 3. reci_toku_user_coins（ユーザーコイン残高）

ユーザーごとの現在のコイン合計を保持するテーブルです。

不整合が怖いのでバッチ処理で毎日coin_transactionsとデータ整合性チェックを行います。

**更新時に注意が必要:**

```sql
-- ❌ 悪い例：エンジニアが計算する（競合が起きる）
UPDATE reci_toku_user_coins SET current_balance = 200 WHERE user_id = 1;

-- ✅ 良い例：DBが計算する（誰が書いても計算が狂わない）。アトミック更新。
UPDATE reci_toku_user_coins
SET current_balance = current_balance + 100
WHERE user_id = 1;
```

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| **`user_id`** | INT | **PK** | 既存Users.idと紐付け |
| **`current_balance`** | INT | **CHECK (>= 0)** | 現在の保有残高。負の値を物理的に禁止 |
| **`last_earned_at`** | DATETIME | Index | **最終獲得日**。これ1つで全残高の有効期限を管理 |
| **`created_at`** | DATETIME | NOT NULL | 初回獲得日時（UTC） |
| **`updated_at`** | DATETIME | NOT NULL | 最終更新日時（UTC） |

**スキーマ定義:**

```sql
CREATE TABLE reci_toku_user_coins (
  user_id INT PRIMARY KEY COMMENT 'ママリユーザーID',
  current_balance INT NOT NULL DEFAULT 0 CHECK (current_balance >= 0) COMMENT '現在残高',
  last_earned_at DATETIME COMMENT '最終獲得日時（有効期限基準）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '初回獲得日時（UTC）',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最終更新日時（UTC）',
  INDEX idx_last_earned_at (last_earned_at),
  INDEX idx_last_earned_balance (last_earned_at, current_balance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ユーザーコイン残高';
```

---

### 4. reci_toku_campaigns（キャンペーンマスタ）

管理画面からキャンペーン（商品）を動的に追加・編集するためのテーブルです。

**運用方針**: CS担当者による手動キュレーション方式（[詳細](https://github.com/Connehito/mamari-spec/issues/6462)）

#### カラム定義

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| **基本情報** |
| `id` | BIGINT | PK / AI | ママリ内部の管理ID |
| `receipt_campaign_id` | VARCHAR(36) | **UNIQUE / Index** | WED/ONE側のキャンペーンUUID。Webhookとの照合用 |
| **WED/ONE基本情報（Webhookペイロード由来）** |
| `receipt_campaign_name` | VARCHAR(255) | NOT NULL | WED側のキャンペーン名（参照用） |
| `receipt_campaign_image` | VARCHAR(500) | - | WED側のサムネイルURL（参照用） |
| `company_name` | VARCHAR(255) | - | 主催企業名（P&G等） |
| `company_id` | VARCHAR(36) | - | 主催企業UUID |
| `incentive_points` | INT | NOT NULL | 付与ポイント数 |
| `service_type` | VARCHAR(20) | NOT NULL | サービス種別（receipt/mission） |
| `campaign_detail_url` | VARCHAR(500) | - | キャンペーン詳細URL |
| **WED/ONE追加情報（MissionDetail由来、将来のAPI連携用）** |
| `is_all_receipt_campaign` | TINYINT | Default: 0 | 全種類（なんでも）レシートか否か（0:特定商品, 1:なんでもOK） |
| `mission_type` | VARCHAR(20) | - | ミッション種別（campaign:通常, group:グループ） |
| `mission_open_at` | DATETIME | - | WED側の開始時刻（時間帯限定の場合） |
| `mission_close_at` | DATETIME | - | WED側の終了時刻（時間帯限定の場合） |
| `price_text` | VARCHAR(100) | - | UI表示用の金額テキスト（例：「最大¥100」） |
| **ママリ側の管理情報** |
| `title` | VARCHAR(255) | NOT NULL | ママリで表示するタイトル（編集可能） |
| `description` | TEXT | - | ママリで表示する説明文（編集可能） |
| `image_url` | VARCHAR(500) | - | ママリで表示する画像URL（編集可能） |
| `display_order` | INT | Default: 0 | 表示順序（小さい順に表示） |
| `is_published` | TINYINT | Default: 0 | 公開フラグ（1:公開, 0:非公開） |
| `published_at` | DATETIME | - | ママリでの公開開始日時（期間限定キャンペーン用） |
| `unpublished_at` | DATETIME | - | ママリでの公開終了日時（自動非公開用） |
| **キュレーション情報** |
| `editor_comment` | TEXT | - | 編集部コメント（ユーザー向け） |
| `tags` | JSON | - | タグ配列（例：["おすすめ", "高ポイント", "期間限定"]） |
| **メタデータ** |
| `created_at` | DATETIME | NOT NULL | レコード作成日時（UTC） |
| `updated_at` | DATETIME | NOT NULL | レコード更新日時（UTC） |
| `created_by` | INT | - | 登録者のuser_id |
| `updated_by` | INT | - | 更新者のuser_id |

#### フィールド使い分けの説明

**WED側情報 vs ママリ側情報:**

| WED側 | ママリ側 | 使い分け |
| --- | --- | --- |
| `receipt_campaign_name` | `title` | WED側の原本を保持しつつ、ママリでは編集可能なタイトルを表示 |
| `receipt_campaign_image` | `image_url` | WED側画像を保持しつつ、ママリ独自の画像も設定可能 |
| `incentive_points` | - | ポイント数はWED側の値をそのまま使用 |

**WED側の時間制限 vs ママリ側の公開期間:**

| 項目 | 用途 | 例 |
| --- | --- | --- |
| `mission_open_at`, `mission_close_at` | WED側の時間帯制限（12:00〜18:00等） | 「夕方限定ミッション」 |
| `published_at`, `unpublished_at` | ママリ側の公開期間制御 | 「2026年3月1日〜3月31日まで表示」 |

**両方が設定されている場合**: 両方の条件を満たす場合のみ表示

**スキーマ定義:**

```sql
CREATE TABLE reci_toku_campaigns (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- WED/ONE基本情報（Webhookペイロード由来）
  receipt_campaign_id VARCHAR(36) NOT NULL COMMENT 'WED/ONEのキャンペーンUUID',
  receipt_campaign_name VARCHAR(255) NOT NULL COMMENT 'WED側キャンペーン名（参照用）',
  receipt_campaign_image VARCHAR(500) COMMENT 'WED側サムネイルURL（参照用）',
  company_name VARCHAR(255) COMMENT '主催企業名',
  company_id VARCHAR(36) COMMENT '主催企業UUID',
  incentive_points INT NOT NULL COMMENT '付与ポイント数',
  service_type VARCHAR(20) NOT NULL COMMENT 'サービス種別（receipt:なんでもレシート, mission:ミッション）',
  campaign_detail_url VARCHAR(500) COMMENT 'キャンペーン詳細URL',

  -- WED/ONE追加情報（MissionDetail由来、将来のAPI連携用）
  is_all_receipt_campaign TINYINT DEFAULT 0 COMMENT '全種類（なんでも）レシートか否か（0:特定商品, 1:なんでもOK）',
  mission_type VARCHAR(20) COMMENT 'ミッション種別（campaign:通常, group:グループ）',
  mission_open_at DATETIME COMMENT 'WED側の開始時刻（時間帯限定の場合）',
  mission_close_at DATETIME COMMENT 'WED側の終了時刻（時間帯限定の場合）',
  price_text VARCHAR(100) COMMENT 'UI表示用の金額テキスト（例：最大¥100）',

  -- ママリ側の管理情報
  title VARCHAR(255) NOT NULL COMMENT 'ママリで表示するタイトル（編集可能）',
  description TEXT COMMENT 'ママリで表示する説明文（編集可能）',
  image_url VARCHAR(500) COMMENT 'ママリで表示する画像URL（編集可能）',
  display_order INT NOT NULL DEFAULT 0 COMMENT '表示順序（小さい順に表示）',
  is_published TINYINT NOT NULL DEFAULT 0 COMMENT '公開フラグ（1:公開, 0:非公開）',
  published_at DATETIME COMMENT 'ママリでの公開開始日時（期間限定キャンペーン用）',
  unpublished_at DATETIME COMMENT 'ママリでの公開終了日時（自動非公開用）',

  -- キュレーション情報
  editor_comment TEXT COMMENT '編集部コメント（ユーザー向け説明文）',
  tags JSON COMMENT 'タグ配列（例：["おすすめ", "高ポイント", "期間限定"]）',

  -- メタデータ
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時（UTC）',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時（UTC）',
  created_by INT COMMENT '登録者のuser_id',
  updated_by INT COMMENT '更新者のuser_id',

  UNIQUE KEY uk_receipt_campaign_id (receipt_campaign_id),
  INDEX idx_published (is_published, published_at),
  INDEX idx_display_order (display_order),
  INDEX idx_service_type (service_type),
  INDEX idx_active_sort (is_published, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='キャンペーンマスタ（手動キュレーション方式）';
```

---

### 5. reci_toku_coin_settings（システム設定）

| **カラム名** | **型** | **制約** | **説明** |
| --- | --- | --- | --- |
| `key` | VARCHAR(64) | **PK** | 設定の識別子 |
| `value` | VARCHAR(255) | NOT NULL | 設定値（プログラム側で型変換して利用） |
| `description` | VARCHAR(255) | - | この設定が何を意味するか、運用者向けのメモ |
| `created_at` | DATETIME | NOT NULL | 設定作成日時（UTC） |
| `updated_at` | DATETIME | NOT NULL | 設定変更日時（UTC） |

**入るデータのイメージ:**

| **key** | **value** | **description** |
| --- | --- | --- |
| `coin_expire_days` | `180` | コイン獲得から失効までの日数 |

**スキーマ定義:**

```sql
CREATE TABLE reci_toku_coin_settings (
  `key` VARCHAR(64) PRIMARY KEY COMMENT '設定キー',
  value VARCHAR(255) NOT NULL COMMENT '設定値',
  description VARCHAR(255) COMMENT '設定の説明',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時（UTC）',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時（UTC）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='システム設定';
```

---

## ユースケース別更新パターン

### 1. Webhook受信時（報酬付与ユースケース）

最も頻繁に発生し、かつ整合性が命となる処理です。

**[事前条件]**
- Webhookを受信する前に、該当する`receipt_campaign_id`のキャンペーンが`reci_toku_campaigns`テーブルに登録されている必要がある
- 未登録の場合はエラーを返す（将来的にはPMN APIから自動同期する仕組みを実装予定）

**[一連の処理を1つのトランザクションで実行]**

1. **キャンペーン存在チェック** (SELECT):
   ```sql
   SELECT id FROM reci_toku_campaigns
   WHERE receipt_campaign_id = :receipt_campaign_id;
   ```
   - キャンペーンが存在しない場合はエラーを返す（HTTP 400）
   - 将来的にはPMN APIから自動取得して登録する機能を追加予定

2. **`reci_toku_rewards`** (INSERT):
   - 復号したJWEの内容をすべて保存
   - `media_cashback_id` のUnique制約により、二重付与が物理的にブロックされる
   - `campaign_id`に取得したIDを設定（NOT NULL）

3. **`reci_toku_user_coins`** (UPDATE):
   ```sql
   UPDATE reci_toku_user_coins
   SET current_balance = current_balance + :amount,
       last_earned_at = NOW()
   WHERE user_id = :user_id;
   ```
   - **アトミック更新**を行い、同時に有効期限の基準日を更新（延長）

4. **`reci_toku_coin_transactions`** (INSERT):
   - `transaction_type: 1 (報酬)` として記録
   - `balance_after` には更新後の残高を入れる

**[トランザクション成功後]**

5. **プッシュ通知の送信** (非同期):
   - SQS/SNSにメッセージを送信
   - 既存のママリプッシュ通知システムに委譲
   - **通知テーブルは不要**（既存システムで管理）

   ```typescript
   // トランザクション成功後に非同期で実行
   await this.sqsService.sendMessage({
     userId: user_id,
     type: 'reci_toku_earned',
     data: {
       campaignName: receipt_campaign_name,
       points: incentive_points,
     },
   });
   ```

### 2. コイン交換時（消費ユースケース）

ユーザーがギフト券などに交換する際の処理です。

**[一連の処理を1つのトランザクションで実行]**

1. **`reci_toku_user_coins`** (SELECT & CHECK):
   - 現在の残高と `last_earned_at` を確認
   - 期限切れでないこと、および残高が足りているかチェック

2. **`reci_toku_user_coins`** (UPDATE):
   ```sql
   UPDATE reci_toku_user_coins
   SET current_balance = current_balance - :amount
   WHERE user_id = :user_id
     AND current_balance >= :amount;
   ```
   - `CHECK (current_balance >= 0)` 制約があるため、万が一残高不足のまま更新しようとしてもDBがエラーを出し、不正な交換を阻止

3. **`reci_toku_coin_transactions`** (INSERT):
   - `transaction_type: 2 (交換)` として、マイナスの `amount` を記録

### 3. 失効処理（毎日深夜のバッチユースケース）

期限が切れたユーザーのコインを回収する処理です。

**注意:** 大量ユーザーの同時処理はDB負荷が高いため、バッチサイズを制御して段階的に実行します。

1. **対象ユーザーの抽出 (SELECT)**:
   ```sql
   SELECT user_id, current_balance
   FROM reci_toku_user_coins
   WHERE last_earned_at < DATE_SUB(NOW(), INTERVAL :coin_expire_days DAY)
     AND current_balance > 0
   LIMIT 1000;  -- バッチサイズで制御（初期値：1000件）
   ```

2. **[複数ユーザーを1トランザクションで処理（バルク更新）]**
   - **`reci_toku_user_coins`** (UPDATE):
     ```sql
     UPDATE reci_toku_user_coins
     SET current_balance = 0
     WHERE user_id IN (:user_ids);  -- バッチ更新
     ```

   - **`reci_toku_coin_transactions`** (INSERT):
     ```sql
     INSERT INTO reci_toku_coin_transactions
       (id, user_id, amount, balance_after, transaction_type, description, created_at)
     VALUES
       (UUID(), :user_id1, :amount1, 0, 3, 'コイン有効期限切れ', NOW()),
       (UUID(), :user_id2, :amount2, 0, 3, 'コイン有効期限切れ', NOW()),
       ...;  -- バルクインサート
     ```

3. **処理が完了するまで1と2を繰り返し**
   - 1回のバッチで1000件ずつ処理
   - DB負荷を分散

### 4. キャンペーン管理（管理画面ユースケース）

運用担当者（CS担当者）が管理画面からキャンペーンを手動キュレーションする処理です。

#### キャンペーン登録・編集の流れ

**[キャンペーン新規登録]**

1. **WED/ONE APIからキャンペーン検索**（将来実装）:
   - CS担当者がキャンペーンIDで検索
   - WED側の情報をプレビュー表示

2. **`reci_toku_campaigns`** (INSERT):
   ```sql
   INSERT INTO reci_toku_campaigns (
     receipt_campaign_id,
     receipt_campaign_name,
     receipt_campaign_image,
     company_name,
     company_id,
     incentive_points,
     service_type,
     title,                    -- ママリ側タイトル（初期値：WED側の名前）
     description,              -- ママリ側説明文（CS担当者が記入）
     image_url,                -- ママリ側画像（初期値：WED側の画像）
     display_order,            -- 表示順序
     is_published,             -- 公開フラグ（初期値：0非公開）
     editor_comment,           -- 編集部コメント
     tags,                     -- タグ（例：["おすすめ", "高ポイント"]）
     created_by
   ) VALUES (...);
   ```

**[キャンペーン編集]**

- **`reci_toku_campaigns`** (UPDATE):
  ```sql
  UPDATE reci_toku_campaigns
  SET
    title = :title,                      -- ママリ側タイトル編集
    description = :description,          -- 説明文編集
    image_url = :image_url,              -- 画像変更
    display_order = :display_order,      -- 表示順変更
    is_published = :is_published,        -- 公開/非公開切り替え
    published_at = :published_at,        -- 公開期間設定
    unpublished_at = :unpublished_at,
    editor_comment = :editor_comment,    -- 編集部コメント追加
    tags = :tags,                        -- タグ編集
    updated_by = :updated_by
  WHERE id = :id;
  ```

**[表示順序の一括変更]**

- **`reci_toku_campaigns`** (BULK UPDATE):
  ```sql
  -- ドラッグ&ドロップでの順序変更
  UPDATE reci_toku_campaigns SET display_order = 1 WHERE id = 10;
  UPDATE reci_toku_campaigns SET display_order = 2 WHERE id = 5;
  UPDATE reci_toku_campaigns SET display_order = 3 WHERE id = 8;
  ```

#### キャンペーン表示条件（Frontend）

ユーザー画面に表示するキャンペーンの抽出条件:

```sql
SELECT * FROM reci_toku_campaigns
WHERE is_published = 1                           -- 公開中
  AND (published_at IS NULL OR published_at <= NOW())      -- 公開開始日時を過ぎている
  AND (unpublished_at IS NULL OR unpublished_at > NOW())   -- 公開終了日時前
ORDER BY display_order ASC, created_at DESC;
```

#### システム設定変更

- **`reci_toku_coin_settings`** (UPDATE):
  - 有効期限の日数や1日の全体上限数を更新

### ユースケース別テーブル更新マトリクス

| **ユースケース** | **campaigns** | **rewards** | **coin_transactions** | **user_coins** | **coin_settings** |
| --- | --- | --- | --- | --- | --- |
| **1. Webhook受信** | 参照 | **INSERT** | **INSERT** | **UPDATE（加算＋期限延長）** | 参照 |
| **2. コイン交換** | - | - | **INSERT** | **UPDATE（減算）** | - |
| **3. 深夜失効バッチ** | - | - | **INSERT** | **UPDATE（0にリセット）** | 参照 |
| **4. キャンペーン管理** | **INSERT/UPDATE** | - | - | - | - |
| **5. 設定変更** | - | - | - | - | **UPDATE** |

---

## レビュー観点

- [x] 既存ママリDBとの命名規則統一 → `reci_toku_` プレフィックス必須
- [x] 外部キー制約のポリシー → usersテーブルへのFKは貼らない
- [x] インデックス設計の妥当性 → 全テーブルに追加完了
- [x] べき等性を担保する制約（media_cashback_id UNIQUE）
- [x] ステータス遷移の妥当性 → トランザクション設計で担保
- [x] 将来拡張性（ドットマネー連携を見据えた設計） → transaction_type拡張可能
- [x] 実ペイロードとの整合性 → 全カラムマッピング確認済み
- [x] タイムゾーン戦略 → UTC保存で統一

## 運用方針

### キャンペーン登録

**手動キュレーション方式を採用** ([決定事項](https://github.com/Connehito/mamari-spec/issues/6462))

**方針:**
- CS担当者が管理画面からキャンペーンを手動で登録・編集
- **登録したキャンペーンのみ**をママリに表示（全自動同期は行わない）
- ママリユーザー層に合ったキャンペーンを厳選してキュレーション
- 表示順序、公開期間、編集部コメント等を柔軟に設定

**理由:**
- ✅ ママリのユーザー層（妊娠・育児中のママ）に合わない商品を除外
- ✅ 表示順序を柔軟にコントロール（おすすめ順、ポイント高い順等）
- ✅ ブランドイメージの維持（不適切なキャンペーンの事前フィルタリング）
- ✅ 運用負荷は許容範囲（目標: 2026年内に100商品、月10-20件の登録作業）

**運用フロー:**

1. **CS担当者が管理画面でキャンペーン登録**
   - WED/ONE側の情報（receipt_campaign_id, 企業名、ポイント数等）を入力
   - ママリ用のタイトル・説明文・画像を設定
   - 編集部コメント、タグ（「おすすめ」「高ポイント」等）を追加
   - 表示順序を設定
   - 公開期間を設定（期間限定キャンペーンの場合）

2. **公開/非公開の制御**
   - `is_published = 1` で公開
   - `published_at`, `unpublished_at` で期間制御

3. **Webhook受信時の挙動**
   - 未登録のキャンペーンIDが来た場合はエラーを返す（HTTP 400）
   - CS担当者に通知し、手動で登録を促す

**将来の拡張:**
- WED/ONE APIからキャンペーン一覧を自動取得する補助機能（検索・プレビュー）
- AIによるレコメンデーション（ママリユーザー層に合うキャンペーンを推薦）
- ただし、最終的な登録判断は人間（CS担当者）が行う

### コイン有効期限

**現在の仕様:**
- 全残高一括延長方式（`last_earned_at`で一括管理）
- ユーザーがコインを獲得するたびに、既存コインも含めて全残高の有効期限が延長される
- シンプルで理解しやすく、実装も容易

**将来検討:**
- 個別ロット管理（FIFO方式）への移行は現時点では予定なし
- ビジネス要件の変更があれば再検討

### パフォーマンス最適化

**初期実装（現在）:**
- UUID: `VARCHAR(36)` で保存（可読性重視）
- 失効バッチ: 1000件ずつ処理

**将来の最適化（必要に応じて）:**
- UUID を `BINARY(16)` に変更（ストレージ削減、インデックス効率化）
- 失効バッチサイズの動的調整
- パーティショニング（データ量が膨大になった場合）

### 将来のDB分離戦略

**現在の構成（Phase 1）:**
- 既存MySQL 8（mamariq DB）に同居
- `reci_toku_` プレフィックスで論理分離
- usersテーブルへのFK制約なし（将来の分離を考慮）

**将来の分離が必要になった場合の選択肢（Phase 2以降）:**

#### シナリオ1: User Service API化

```
[Mamari] → [User Service API] ← [Receipt Reward Service]
              ↓
          [mamariq.users]
```

**特徴:**
- usersテーブルを共通認証サービスとして切り出し
- レシートリワードからはREST/GraphQL経由でアクセス
- トランザクション整合性は失われるが、API経由で柔軟に連携可能

**メリット:**
- ✅ 完全な疎結合
- ✅ 将来的に他サービスも同じUser Service APIを使用可能
- ✅ スケーリングが独立

**デメリット:**
- ❌ API通信のオーバーヘッド
- ❌ トランザクション整合性の複雑化
- ❌ User Service API構築コスト

---

#### シナリオ2: Read Replica参照

```
[Receipt Reward Service]
    ↓ Write
[reci_toku_db]
    ↓ Read Only
[mamariq.users (Read Replica)]
```

**特徴:**
- 書き込みは独立DB（reci_toku_db）
- users情報は読み取り専用レプリカ経由で参照
- レプリケーション遅延（数秒）を許容

**メリット:**
- ✅ 書き込み処理は完全に独立
- ✅ users参照は高速（DB直接アクセス）
- ✅ 既存インフラ（RDS）の機能で実現可能

**デメリット:**
- ❌ レプリケーション遅延による結果整合性
- ❌ Read Replica管理コスト
- ❌ 新規ユーザー登録直後の参照で不整合の可能性

---

#### シナリオ3: Event Driven（最も疎結合）

```
[Mamari] → [Event Bus] → [Receipt Reward Service]
              ↓
   user.created / user.updated
```

**特徴:**
- 必要最小限のユーザー情報をイベント経由で複製
- 結果整合性を許容
- 完全な非同期処理

**メリット:**
- ✅ 完全な疎結合・独立性
- ✅ スケーラビリティが最も高い
- ✅ 障害隔離が完璧

**デメリット:**
- ❌ Event Bus（SNS/SQS/EventBridge）の構築・運用コスト
- ❌ 結果整合性による一時的な不整合
- ❌ デバッグ・トラブルシューティングの複雑化

---

**推奨方針:**

Phase 1（現在）では**既存DBに同居**が最適です。将来の分離が必要になった場合は、以下の順で検討：

1. **まずシナリオ2（Read Replica）** - 最も低コストで実現可能
2. **次にシナリオ1（User Service API）** - 他サービスとの共通化が見込める場合
3. **最後にシナリオ3（Event Driven）** - マイクロサービス化が本格化した場合

分離時期の目安：
- DAU 10万人超え
- トランザクション数が1日100万件超え
- 他のママリ機能のマイクロサービス化が進んだ時

## 確認事項

- [x] 既存の `users` テーブルとの連携方法 → アプリケーション層で `media_user_code` から逆引き
- [x] `campaign_id` のNullable仕様 → NOT NULL（未登録キャンペーンはエラー）
- [x] コイン有効期限の管理方法 → 全残高一括延長方式（`last_earned_at`で管理）
- [x] 失効バッチの実装方式 → バッチサイズ1000件で段階的処理
- [x] UUIDの保存形式 → VARCHAR(36)（初期実装、将来BINARY(16)も検討可）
- [x] プッシュ通知テーブルとの連携 → SQS/SNS経由で既存システムに委譲（テーブル不要）
- [x] タイムゾーン（JST/UTC） → UTC保存、JST受信を変換

---

## 参考リンク

- **[プロジェクト管理（GitHub Projects）](https://github.com/orgs/Connehito/projects/50)** - タスク管理・進捗確認
- [アーキテクチャ設計書（ARCHITECTURE.md）](./ARCHITECTURE.md)
- [開発ガイド（CLAUDE.md）](./CLAUDE.md)
- [ADR：なぜNest.js(Clean Architecture) + Next.jsを選んだか](https://github.com/Connehito/mamari-spec/issues/6461)

---

**最終更新日**: 2026-02-16
