import { Module, Global } from '@nestjs/common';
import { TOKENS } from '../domain/tokens';
import { AwsSecretsService } from '../infrastructure/services/aws-secrets.service';
import { JoseEncryptionService } from '../infrastructure/services/jose-encryption.service';
import { TypeOrmTransactionManager } from '../infrastructure/services/typeorm-transaction-manager.service';

/**
 * Infrastructure Service Module
 *
 * @Global デコレータにより、全Moduleで利用可能にする
 * Clean Architecture原則: Infrastructure層のサービスをDomain InterfaceでDI
 */
@Global()
@Module({
  providers: [
    { provide: TOKENS.ISecretsService, useClass: AwsSecretsService },
    { provide: TOKENS.IEncryptionService, useClass: JoseEncryptionService },
    {
      provide: TOKENS.ITransactionManager,
      useClass: TypeOrmTransactionManager,
    },
  ],
  exports: [TOKENS.ISecretsService, TOKENS.IEncryptionService, TOKENS.ITransactionManager],
})
export class InfrastructureModule {}
