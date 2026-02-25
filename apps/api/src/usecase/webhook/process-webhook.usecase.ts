import { Injectable, Inject, Logger } from '@nestjs/common';
import { TOKENS } from '../../domain/tokens';
import { ITransactionManager } from '../../domain/services/transaction-manager.interface';
import { IRewardRepository } from '../../domain/repositories/reward.repository.interface';
import { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import { Reward } from '../../domain/entities/reward.entity';
import { CoinTransaction } from '../../domain/entities/coin-transaction.entity';
import { UserCoin } from '../../domain/entities/user-coin.entity';
import { ProcessWebhookInput } from './dto/process-webhook.input';
import { AlreadyProcessedError } from '../../domain/exceptions/already-processed.error';
import { CampaignNotFoundError } from '../../domain/exceptions/campaign-not-found.error';

/**
 * Webhook処理UseCase
 *
 * Performance Media NetworkからのWebhook通知を処理し、コインを付与する
 *
 * 重要な実装ポイント:
 * 1. べき等性保証: media_cashback_idで重複チェック（UNIQUE制約）
 * 2. トランザクション整合性: UnitOfWork経由で3テーブルを原子的に更新
 * 3. エラーハンドリング: AlreadyProcessedError / CampaignNotFoundError で判別
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
    @Inject(TOKENS.ICampaignRepository)
    private readonly campaignRepository: ICampaignRepository,
    @Inject(TOKENS.ITransactionManager)
    private readonly transactionManager: ITransactionManager,
  ) {}

  /**
   * Webhookを処理してコインを付与
   *
   * @param payload - Webhookペイロード
   * @throws CampaignNotFoundError - キャンペーン未登録
   * @throws AlreadyProcessedError - 重複処理
   */
  async execute(payload: ProcessWebhookInput): Promise<void> {
    this.logger.log(
      `Webhook処理開始: userId=${payload.media_user_code}, cashbackId=${payload.media_cashback_id}`,
    );

    // 1. キャンペーン存在確認
    const campaign = await this.campaignRepository.findByReceiptCampaignId(
      payload.receipt_campaign_id,
    );
    if (!campaign) {
      this.logger.error(`キャンペーンが未登録です: ${payload.receipt_campaign_id}`);
      throw new CampaignNotFoundError(payload.receipt_campaign_id);
    }

    // 2. べき等性チェック（重複処理防止）
    const existingReward = await this.rewardRepository.findByMediaCashbackId(
      payload.media_cashback_id,
    );
    if (existingReward) {
      this.logger.warn(`重複したWebhookを検出: cashbackId=${payload.media_cashback_id}`);
      throw new AlreadyProcessedError(payload.media_cashback_id);
    }

    // 3. トランザクション内で3テーブル原子的更新（UnitOfWork経由）
    await this.transactionManager.execute(async (uow) => {
      const userId = parseInt(payload.media_user_code, 10);

      // 3-1. Reward作成・保存（IDはDB AUTO_INCREMENTで採番）
      const reward = Reward.create({
        userId,
        campaignId: campaign.getId()!,
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
      const savedReward = await uow.rewardRepository.save(reward);

      // 3-2. UserCoin残高更新
      let userCoin = await uow.userCoinRepository.findByUserId(userId);
      if (!userCoin) {
        // 初回獲得時はUserCoin作成
        userCoin = UserCoin.create(userId);
      }
      userCoin.addBalance(payload.incentive_points);
      await uow.userCoinRepository.save(userCoin);

      // 3-3. CoinTransaction記録（IDはDB AUTO_INCREMENTで採番）
      const transaction = CoinTransaction.createRewardTransaction(
        userId,
        payload.incentive_points,
        userCoin.getBalance(),
        savedReward.getId()!,
        payload.media_cashback_id,
        `${campaign.getTitle()}参加`,
      );
      await uow.coinTransactionRepository.save(transaction);

      this.logger.log(
        `Webhook処理完了: userId=${userId}, points=${payload.incentive_points}, balance=${userCoin.getBalance()}`,
      );
    });
  }
}
