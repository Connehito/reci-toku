import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  IsDateString,
  IsOptional,
  Matches,
} from 'class-validator';

/**
 * Webhook受信ペイロードDTO
 *
 * Performance Media Networkから送信されるWebhookのペイロード
 * Presenter層に配置（class-validatorはフレームワーク依存）
 */
export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  media_id!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'media_user_codeは数値文字列である必要があります' })
  media_user_code!: string;

  @IsString()
  @IsNotEmpty()
  media_cashback_id!: string; // べき等性保証のキー（UNIQUE制約）

  @IsString()
  @IsNotEmpty()
  @Length(15, 15)
  media_cashback_code!: string; // 15桁コード

  @IsString()
  @IsNotEmpty()
  receipt_campaign_id!: string;

  @IsString()
  @IsOptional()
  receipt_campaign_name?: string | null;

  @IsString()
  @IsOptional()
  receipt_campaign_image?: string | null;

  @IsString()
  @IsOptional()
  company_id?: string | null;

  @IsString()
  @IsOptional()
  company_name?: string | null;

  @IsString()
  @IsOptional()
  service_type?: string | null;

  @IsNumber()
  @IsNotEmpty()
  incentive_points!: number;

  @IsDateString()
  @IsNotEmpty()
  participation_at!: string; // ISO8601形式

  @IsDateString()
  @IsNotEmpty()
  processed_at!: string; // ISO8601形式

  @IsString()
  @IsOptional()
  jwe_payload?: string | null;
}
