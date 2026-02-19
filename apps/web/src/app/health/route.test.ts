/**
 * @jest-environment node
 */
import { GET } from './route';

describe('Health Route', () => {
  it('should return health status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('service', 'receipt-reward-web');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });
});
