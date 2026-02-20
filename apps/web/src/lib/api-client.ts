/**
 * APIクライアント
 * Backend APIとの通信を担当
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * APIリクエストのベース関数
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * ヘルスチェックAPI
 */
export async function healthCheck(): Promise<{ status: string }> {
  return request('/health');
}

// 今後、キャンペーン取得、コイン残高確認などのAPI関数を追加
