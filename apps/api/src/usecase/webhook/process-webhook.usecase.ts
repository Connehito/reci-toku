import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TOKENS } from '../../domain/tokens';
import { ITransactionManager } from '../../domain/services/transaction-manager.interface';
import { IRewardRepository } from '../../domain/repositories/reward.repository.interface';
import { IUserCoinRepository } from '../../domain/repositories/user-coin.repository.interface';
import { ICoinTransactionRepository } from '../../domain/repositories/coin-transaction.repository.interface';
import { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import { Reward } from '../../domain/entities/reward.entity';
import { CoinTransaction } from '../../domain/entities/coin-transaction.entity';
import { UserCoin } from '../../domain/entities/user-coin.entity';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

/**
 * Webhook処理UseCase
 *
 * Performance Media NetworkからのWebhook通知を処理し、コインを付与する
 *
 * 重要な実装ポイント:
 * 1. べき等性保証: media_cashback_idで重複チェック（UNIQUE制約）
 * 2. トランザクション整合性: 3テーブルを原子的に更新
 * 3. エラーハンドリング: ALREADY_PROCESSED は特別扱い
 *
 * Clean Architecture原則:
 * - Domain層のInterfaceにのみ依存
 * - Infrastructure層の具象クラスに依存しない
 */
@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);

  constructor(
    @Inject(TOKENS.IRewardRepository)
    private readonly rewardRepository: IRewardRepository,
    @Inject(TOKENS.IUserCoinRepository)
    private readonly userCoinRepository: IUserCoinRepository,
    @Inject(TOKENS.ICoinTransactionRepository)
    private readonly coinTransactionRepository: ICoinTransactionRepository,
    @Inject(TOKENS.ICampaignRepository)
    private readonly campaignRepository: ICampaignRepository,
    @Inject(TOKENS.ITransactionManager)
    private readonly transactionManager: ITransactionManager,
  ) {}

  /**
   * Webhookを処理してコインを付与
   *
   * @param payload - Webhookペイロード
   * @throws Error - キャンペーン未登録、重複処理
   */
  async execute(payload: WebhookPayloadDto): Promise<void> {
    this.logger.log(
      `Webhook処理開始: userId=${payload.media_user_code}, cashbackId=${payload.media_cashback_id}`,
    );

    // 1. キャンペーン存在確認
    const campaign = await this.campaignRepository.findByReceiptCampaignId(
      payload.receipt_campaign_id,
    );
    if (!campaign) {
      const errorMsg = `キャンペーンが未登録です: ${payload.receipt_campaign_id}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 2. べき等性チェック（重複処理防止）
    const existingReward = await this.rewardRepository.findByMediaCashbackId(
      payload.media_cashback_id,
    );
    if (existingReward) {
      this.logger.warn(`重複したWebhookを検出: cashbackId=${payload.media_cashback_id}`);
      throw new Error('ALREADY_PROCESSED');
    }

    // 3. トランザクション内で3テーブル原子的更新
    await this.transactionManager.execute(async () => {
      const userId = parseInt(payload.media_user_code);

      // 3-1. Reward作成・保存
      const reward = Reward.create({
        id: uuidv4(),
        userId,
        campaignId: campaign.getId(),
        mediaId: payload.media_id,
        mediaUserCode: payload.media_user_code,
        mediaCashbackId: payload.media_cashback_id,
        mediaCashbackCode: payload.media_cashback_code,
        receiptCampaignId: payload.receipt_campaign_id,
        receiptCampaignName: payload.receipt_campaign_name || null,
        receiptCampaignImage: payload.receipt_campaign_image || null,
        companyId: payload.company_id || null,
        companyName: payload.company_name || null,
        serviceType: payload.service_type || null,
        incentivePoints: payload.incentive_points,
        participationAt: new Date(payload.participation_at),
        processedAt: new Date(payload.processed_at),
        jwePayload: JSON.stringify(payload), // 万が一のために常に全データを保存
      });
      await this.rewardRepository.save(reward);

      // 3-2. UserCoin残高更新
      let userCoin = await this.userCoinRepository.findByUserId(userId);
      if (!userCoin) {
        // 初回獲得時はUserCoin作成
        userCoin = UserCoin.create(userId);
      }
      userCoin.addBalance(payload.incentive_points);
      await this.userCoinRepository.save(userCoin);

      // 3-3. CoinTransaction記録
      const transaction = CoinTransaction.createRewardTransaction(
        uuidv4(),
        userId,
        payload.incentive_points,
        userCoin.getBalance(),
        reward.getId(),
        payload.media_cashback_id,
        `${campaign.getTitle()}参加`,
      );
      await this.coinTransactionRepository.save(transaction);

      this.logger.log(
        `Webhook処理完了: userId=${userId}, points=${payload.incentive_points}, balance=${userCoin.getBalance()}`,
      );
    });
  }
}
