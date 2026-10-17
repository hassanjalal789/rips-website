// Sliding-window limiter: 5 requests per hour per device/IP (Doc 08 Q27).
// Memory is per function instance. On the chosen host (OD-03) swap this for the
// host's key-value store or built-in rate limiting so the limit holds across instances.

export function createMemoryRateLimiter({ max = 5, windowMs = 60 * 60 * 1000 } = {}) {
  const hits = new Map();
  return {
    async hit(key, now = new Date()) {
      const t = now.getTime();
      const list = (hits.get(key) || []).filter((ms) => t - ms < windowMs);
      if (list.length >= max) {
        hits.set(key, list);
        const retryAfterSeconds = Math.ceil((list[0] + windowMs - t) / 1000);
        return { allowed: false, retryAfterSeconds };
      }
      list.push(t);
      hits.set(key, list);
      return { allowed: true };
    },
  };
}
