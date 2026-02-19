// サンプルテスト（動作確認用）
describe('Sample Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
