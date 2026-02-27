/**
 * Webhook処理UseCaseの入力型
 *
 * UseCase層はフレームワーク非依存のプレーンなinterfaceに依存する。
 * Presenter層のWebhookPayloadDtoはこのinterfaceと構造的に互換なため、
 * TypeScriptの構造的型付けによりそのまま渡せる。
 */
export interface ProcessWebhookInput {
  media_id: string;
  media_user_code: string;
  media_cashback_id: string;
  media_cashback_code: string;
  receipt_campaign_id: string;
  receipt_campaign_name?: string | null;
  receipt_campaign_image?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  service_type?: string | null;
  incentive_points: number;
  participation_at: string;
  processed_at: string;
  jwe_payload?: string | null;
}
