import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('allows up to the limit within the window, then blocks', () => {
    const limiter = new RateLimiter(3, 1000);
    expect([1, 2, 3, 4].map((t) => limiter.take('p1', t))).toEqual([true, true, true, false]);
  });

  it('recovers once old hits leave the window', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.take('p1', 0)).toBe(true);
    expect(limiter.take('p1', 500)).toBe(false);
    expect(limiter.take('p1', 1001)).toBe(true);
  });

  it('tracks keys independently', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.take('a', 0)).toBe(true);
    expect(limiter.take('b', 0)).toBe(true);
  });
});
