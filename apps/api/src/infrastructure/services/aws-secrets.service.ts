import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { ISecretsService, PMNCredentials } from '../../domain/services/secrets.service.interface';

/**
 * AWS Secrets Managerを使用したシークレット管理サービス
 *
 * Clean Architecture原則:
 * - Domain層のISecretsServiceを実装
 * - AWS SDKの詳細をDomain層から隠蔽
 */
@Injectable()
export class AwsSecretsService implements ISecretsService {
  private readonly logger = new Logger(AwsSecretsService.name);
  private readonly client: SecretsManagerClient;

  constructor(private readonly configService: ConfigService) {
    this.client = new SecretsManagerClient({
      region: this.configService.get<string>('AWS_REGION', 'ap-northeast-1'),
    });
  }

  async getPMNCredentials(): Promise<PMNCredentials> {
    try {
      const secretId = this.configService.get<string>(
        'PMN_SECRET_ID',
        'reci-toku/pmn-credentials',
      );
      const command = new GetSecretValueCommand({
        SecretId: secretId,
      });
      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error('SecretStringが取得できませんでした');
      }

      const secret = JSON.parse(response.SecretString);

      if (!secret.encryption_key || !secret.client_id) {
        throw new Error('PMN認証情報が不正です（encryption_key, client_idが必要）');
      }

      return {
        encryptionKey: secret.encryption_key,
        clientId: secret.client_id,
      };
    } catch (error) {
      this.logger.error('PMN認証情報の取得に失敗しました', error);
      throw error;
    }
  }
}
