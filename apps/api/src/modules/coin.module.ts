import { Module } from '@nestjs/common';
import { GetCoinBalanceUseCase } from '../usecase/coin/get-coin-balance.usecase';
import { GetCoinHistoryUseCase } from '../usecase/coin/get-coin-history.usecase';
import { CoinController } from '../presenter/http/coin/coin.controller';

/**
 * Coin Module
 *
 * コイン関連のUseCase、Controllerを管理
 * InfrastructureModule、RepositoryModuleから必要なサービスをインポート
 */
@Module({
  providers: [GetCoinBalanceUseCase, GetCoinHistoryUseCase],
  controllers: [CoinController],
})
export class CoinModule {}
