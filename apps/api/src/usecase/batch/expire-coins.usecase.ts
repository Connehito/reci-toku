import { Injectable, Inject, Logger } from '@nestjs/common';
import { TOKENS } from '../../domain/tokens';
import { IUserCoinRepository } from '../../domain/repositories/user-coin.repository.interface';
import { ICoinSettingRepository } from '../../domain/repositories/coin-setting.repository.interface';
import { ITransactionManager } from '../../domain/services/transaction-manager.interface';
import { CoinTransaction } from '../../domain/entities/coin-transaction.entity';
import { ExpireCoinsResultDto } from './dto/expire-coins-result.dto';

/**
 * コイン失効バッチUseCase
 *
 * 有効期限切れのユーザーコインを一括失効させる。
 * 各ユーザーを個別トランザクションで処理し、1ユーザーの失敗が他に影響しないようにする。
 */
@Injectable()
export class ExpireCoinsUseCase {
  private readonly logger = new Logger(ExpireCoinsUseCase.name);
  private readonly DEFAULT_EXPIRE_DAYS = 180;

  constructor(
    @Inject(TOKENS.IUserCoinRepository)
    private readonly userCoinRepository: IUserCoinRepository,
    @Inject(TOKENS.ICoinSettingRepository)
    private readonly coinSettingRepository: ICoinSettingRepository,
    @Inject(TOKENS.ITransactionManager)
    private readonly transactionManager: ITransactionManager,
  ) {}

  /**
   * コイン失効バッチを実行
   *
   * @returns バッチ実行結果
   */
  async execute(): Promise<ExpireCoinsResultDto> {
    const startTime = Date.now();

    // 1. 有効期限日数を取得
    const expireDays = await this.getExpireDays();
    this.logger.log(`コイン失効バッチ開始: expireDays=${expireDays}`);

    // 2. 有効期限切れのユーザーコインを取得
    const expiredCoins = await this.userCoinRepository.findExpiredCoins(expireDays);
    this.logger.log(`失効対象ユーザー数: ${expiredCoins.length}`);

    if (expiredCoins.length === 0) {
      this.logger.log('コイン失効バッチ完了: 対象ユーザーなし');
      return {
        totalProcessed: 0,
        totalExpired: 0,
        totalFailed: 0,
        failedUserIds: [],
        elapsedMs: Date.now() - startTime,
      };
    }

    // 3. 各ユーザーを個別トランザクションで処理
    let totalProcessed = 0;
    let totalExpired = 0;
    let totalFailed = 0;
    const failedUserIds: number[] = [];

    for (const userCoin of expiredCoins) {
      const userId = userCoin.getUserId();
      try {
        const expiredAmount = await this.transactionManager.execute(async (uow) => {
          // トランザクション内で最新状態を再確認（Race Condition対策）
          const latestUserCoin = await uow.userCoinRepository.findByUserId(userId);
          if (!latestUserCoin || latestUserCoin.getBalance() === 0) {
            this.logger.debug(`失効スキップ（残高0）: userId=${userId}`);
            return 0;
          }

          // コイン残高を0にして失効額を取得
          const amount = latestUserCoin.expire();
          await uow.userCoinRepository.save(latestUserCoin);

          // 失効トランザクション記録
          const transaction = CoinTransaction.createExpireTransaction(
            userId,
            -amount,
            0,
            'コイン有効期限切れ',
          );
          await uow.coinTransactionRepository.save(transaction);

          return amount;
        });

        if (expiredAmount > 0) {
          totalProcessed++;
          totalExpired += expiredAmount;
        }
        this.logger.debug(`コイン失効成功: userId=${userId}, amount=${expiredAmount}`);
      } catch (error) {
        totalFailed++;
        failedUserIds.push(userId);
        this.logger.error(
          `コイン失効失敗: userId=${userId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    const elapsedMs = Date.now() - startTime;
    this.logger.log(
      `コイン失効バッチ完了: processed=${totalProcessed}, expired=${totalExpired}, failed=${totalFailed}, elapsed=${elapsedMs}ms`,
    );

    if (totalFailed > 0) {
      this.logger.warn(`失敗ユーザー数: ${totalFailed}`);
    }

    return {
      totalProcessed,
      totalExpired,
      totalFailed,
      failedUserIds,
      elapsedMs,
    };
  }

  /**
   * 有効期限日数を設定から取得（未設定時はデフォルト180日）
   */
  private async getExpireDays(): Promise<number> {
    const setting = await this.coinSettingRepository.findByKey('coin_expire_days');
    return setting ? setting.getValueAsNumber() : this.DEFAULT_EXPIRE_DAYS;
  }
}
