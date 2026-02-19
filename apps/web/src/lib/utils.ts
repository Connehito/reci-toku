/**
 * ユーティリティ関数
 */

/**
 * 日付をフォーマット
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * コイン数をフォーマット（カンマ区切り）
 */
export function formatCoins(coins: number): string {
  return coins.toLocaleString('ja-JP');
}
