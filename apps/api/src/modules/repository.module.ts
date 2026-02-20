import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TOKENS } from '../domain/tokens';
import { UserCoinSchema } from '../infrastructure/database/schemas/user-coin.schema';
import { CoinTransactionSchema } from '../infrastructure/database/schemas/coin-transaction.schema';
import { RewardSchema } from '../infrastructure/database/schemas/reward.schema';
import { CampaignSchema } from '../infrastructure/database/schemas/campaign.schema';
import { CoinSettingSchema } from '../infrastructure/database/schemas/coin-setting.schema';
import { UserCoinRepository } from '../infrastructure/repositories/user-coin.repository';
import { CoinTransactionRepository } from '../infrastructure/repositories/coin-transaction.repository';
import { RewardRepository } from '../infrastructure/repositories/reward.repository';
import { CampaignRepository } from '../infrastructure/repositories/campaign.repository';
import { CoinSettingRepository } from '../infrastructure/repositories/coin-setting.repository';

/**
 * Repository Module
 *
 * @Global デコレータにより、全Moduleで利用可能にする
 * Clean Architecture原則: Domain層のRepository Interfaceを実装してDI
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCoinSchema,
      CoinTransactionSchema,
      RewardSchema,
      CampaignSchema,
      CoinSettingSchema,
    ]),
  ],
  providers: [
    // Repository実装をTOKENSでバインド（型安全）
    { provide: TOKENS.IUserCoinRepository, useClass: UserCoinRepository },
    {
      provide: TOKENS.ICoinTransactionRepository,
      useClass: CoinTransactionRepository,
    },
    { provide: TOKENS.IRewardRepository, useClass: RewardRepository },
    { provide: TOKENS.ICampaignRepository, useClass: CampaignRepository },
    {
      provide: TOKENS.ICoinSettingRepository,
      useClass: CoinSettingRepository,
    },
  ],
  exports: [
    TOKENS.IUserCoinRepository,
    TOKENS.ICoinTransactionRepository,
    TOKENS.IRewardRepository,
    TOKENS.ICampaignRepository,
    TOKENS.ICoinSettingRepository,
  ],
})
export class RepositoryModule {}
