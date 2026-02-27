/**
 * キャンペーン未登録エラー
 *
 * Domain層の例外クラス（フレームワーク非依存）
 * Webhook受信時に指定されたreceipt_campaign_idに対応するキャンペーンが未登録の場合にスローされる
 */
export class CampaignNotFoundError extends Error {
  constructor(receiptCampaignId: string) {
    super(`キャンペーンが未登録です: ${receiptCampaignId}`);
    this.name = 'CampaignNotFoundError';
  }
}
