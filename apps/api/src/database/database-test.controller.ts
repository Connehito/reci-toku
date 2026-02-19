import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSchema } from '../infrastructure/database/schemas/user.schema';
import { CampaignSchema } from '../infrastructure/database/schemas/campaign.schema';
import { UserCoinSchema } from '../infrastructure/database/schemas/user-coin.schema';
import { RewardSchema } from '../infrastructure/database/schemas/reward.schema';
import { CoinTransactionSchema } from '../infrastructure/database/schemas/coin-transaction.schema';
import { CoinSettingSchema } from '../infrastructure/database/schemas/coin-setting.schema';

// データベース接続テスト用コントローラー
// 本番環境では削除または無効化する
@Controller('db-test')
export class DatabaseTestController {
  constructor(
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<UserSchema>,
    @InjectRepository(CampaignSchema)
    private readonly campaignRepository: Repository<CampaignSchema>,
    @InjectRepository(UserCoinSchema)
    private readonly userCoinRepository: Repository<UserCoinSchema>,
    @InjectRepository(RewardSchema)
    private readonly rewardRepository: Repository<RewardSchema>,
    @InjectRepository(CoinTransactionSchema)
    private readonly transactionRepository: Repository<CoinTransactionSchema>,
    @InjectRepository(CoinSettingSchema)
    private readonly settingRepository: Repository<CoinSettingSchema>,
  ) {}

  // 接続確認用: ユーザー件数を取得
  @Get('count')
  async getUserSchemaCount() {
    const count = await this.userRepository.count();
    return {
      status: 'ok',
      message: 'Database connection successful',
      userCount: count,
    };
  }

  // 接続確認用: 最新ユーザー1件を取得
  @Get('latest')
  async getLatestUserSchema() {
    const users = await this.userRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    const user = users[0] || null;

    return {
      status: 'ok',
      message: 'Database query successful',
      user: user
        ? {
            id: user.id,
            uuid: user.uuid,
            createdAt: user.createdAt,
          }
        : null,
    };
  }

  // レシートリワードテーブルの接続確認
  @Get('reci-toku/tables')
  async getReceiptRewardTableCounts() {
    const [campaignCount, userCoinCount, rewardCount, transactionCount, settingCount] =
      await Promise.all([
        this.campaignRepository.count(),
        this.userCoinRepository.count(),
        this.rewardRepository.count(),
        this.transactionRepository.count(),
        this.settingRepository.count(),
      ]);

    return {
      status: 'ok',
      message: 'Receipt reward tables connection successful',
      tables: {
        campaigns: campaignCount,
        userCoins: userCoinCount,
        rewards: rewardCount,
        transactions: transactionCount,
        settings: settingCount,
      },
    };
  }

  // レシートリワードテーブルが存在するか確認
  @Get('reci-toku/check')
  async checkReceiptRewardTables() {
    try {
      // 各テーブルに対してシンプルなクエリを実行
      await Promise.all([
        this.campaignRepository.query('SELECT 1 FROM reci_toku_campaigns LIMIT 1'),
        this.userCoinRepository.query('SELECT 1 FROM reci_toku_user_coins LIMIT 1'),
        this.rewardRepository.query('SELECT 1 FROM reci_toku_rewards LIMIT 1'),
        this.transactionRepository.query('SELECT 1 FROM reci_toku_coin_transactions LIMIT 1'),
        this.settingRepository.query('SELECT 1 FROM reci_toku_coin_settings LIMIT 1'),
      ]);

      return {
        status: 'ok',
        message: 'All receipt reward tables exist and are accessible',
        tables: {
          reci_toku_campaigns: 'exists',
          reci_toku_user_coins: 'exists',
          reci_toku_rewards: 'exists',
          reci_toku_coin_transactions: 'exists',
          reci_toku_coin_settings: 'exists',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Some receipt reward tables do not exist',
        error: error instanceof Error ? error.message : String(error),
        note: 'Please run Ridgepole migration in mamari-db repository first',
      };
    }
  }
}
