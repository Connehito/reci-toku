import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { typeOrmConfig } from '../config/typeorm.config';
import { UserSchema } from '../infrastructure/database/schemas/user.schema';
import { RewardSchema } from '../infrastructure/database/schemas/reward.schema';
import { CoinTransactionSchema } from '../infrastructure/database/schemas/coin-transaction.schema';
import { UserCoinSchema } from '../infrastructure/database/schemas/user-coin.schema';
import { CampaignSchema } from '../infrastructure/database/schemas/campaign.schema';
import { CoinSettingSchema } from '../infrastructure/database/schemas/coin-setting.schema';
import { DatabaseTestController } from './database-test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    TypeOrmModule.forFeature([
      UserSchema,
      RewardSchema,
      CoinTransactionSchema,
      UserCoinSchema,
      CampaignSchema,
      CoinSettingSchema,
    ]),
  ],
  controllers: [DatabaseTestController],
})
export class DatabaseModule {}
