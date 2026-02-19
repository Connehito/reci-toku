import { useState, useEffect } from 'react';

/**
 * コイン残高を取得するカスタムフック
 * TODO: 実際のAPI連携を実装
 */
export function useCoinBalance(userId: number) {
  const [balance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: API呼び出しを実装
    setLoading(false);
  }, [userId]);

  return { balance, loading, error };
}
