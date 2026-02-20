import { Injectable, Inject, Logger } from '@nestjs/common';
import { TOKENS } from '../../domain/tokens';
import { IUserCoinRepository } from '../../domain/repositories/user-coin.repository.interface';
import { ICoinSettingRepository } from '../../domain/repositories/coin-setting.repository.interface';
import { CoinBalanceResponseDto } from './dto/coin-balance-response.dto';

/**
 * コイン残高照会UseCase
 *
 * ユーザーのコイン残高と有効期限を取得する
 *
 * Clean Architecture原則:
 * - Domain層のInterfaceにのみ依存
 * - Infrastructure層の具象クラスに依存しない
 */
@Injectable()
export class GetCoinBalanceUseCase {
  private readonly logger = new Logger(GetCoinBalanceUseCase.name);
  private readonly DEFAULT_EXPIRE_DAYS = 180; // デフォルト有効期限日数

  constructor(
    @Inject(TOKENS.IUserCoinRepository)
    private readonly userCoinRepository: IUserCoinRepository,
    @Inject(TOKENS.ICoinSettingRepository)
    private readonly coinSettingRepository: ICoinSettingRepository,
  ) {}

  /**
   * コイン残高を取得
   *
   * @param userId - ユーザーID
   * @returns コイン残高レスポンス
   */
  async execute(userId: number): Promise<CoinBalanceResponseDto> {
    this.logger.log(`コイン残高照会: userId=${userId}`);

    // ユーザーIDのバリデーション
    if (!userId || userId <= 0) {
      throw new Error('不正なユーザーIDです');
    }

    // ユーザーコイン残高取得
    const userCoin = await this.userCoinRepository.findByUserId(userId);
    if (!userCoin) {
      // 初回獲得前
      return {
        balance: 0,
        lastEarnedAt: null,
        expiresAt: null,
      };
    }

    // 有効期限日数取得（CoinSettingから）
    const expireDaysSetting =
      await this.coinSettingRepository.findByKey('coin_expire_days');
    const expireDays = expireDaysSetting
      ? expireDaysSetting.getValueAsNumber()
      : this.DEFAULT_EXPIRE_DAYS;

    // 有効期限計算
    const lastEarnedAt = userCoin.getLastEarnedAt();
    let expiresAt: Date | null = null;

    if (lastEarnedAt && userCoin.getBalance() > 0) {
      expiresAt = new Date(lastEarnedAt);
      expiresAt.setDate(expiresAt.getDate() + expireDays);
    }

    return {
      balance: userCoin.getBalance(),
      lastEarnedAt: lastEarnedAt ? lastEarnedAt.toISOString() : null,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  }
}
