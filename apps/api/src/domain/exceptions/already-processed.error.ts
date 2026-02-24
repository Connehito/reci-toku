/**
 * 既に処理済みのWebhookエラー
 *
 * Domain層の例外クラス（フレームワーク非依存）
 * 同じmedia_cashback_idのWebhookが重複して送信された場合にスローされる
 */
export class AlreadyProcessedError extends Error {
  constructor(mediaCashbackId: string) {
    super(`既に処理済みのWebhookです: ${mediaCashbackId}`);
    this.name = 'AlreadyProcessedError';
  }
}
