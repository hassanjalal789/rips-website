// Builds the handler's dependencies from environment settings (Doc 07 Q13: config lives in the host, not the code).
import { createMockStore } from './adapters/mock-store.js';
import { createMockMailer } from './adapters/mock-mailer.js';
import { createMemoryRateLimiter } from './adapters/memory-rate-limiter.js';
import { createGoogleSheetStore } from './adapters/google-sheet.js';
import { createEmailAdapter } from './adapters/email.js';
import { createCaptcha } from './adapters/captcha.js';
import siteData from './generated/site-data.js';

let cached;

export function buildDeps(env = {}) {
  if (cached) return cached;
  const store = env.SHEET_ADAPTER === 'google' ? createGoogleSheetStore(env) : createMockStore();
  const mailer = env.EMAIL_ADAPTER && env.EMAIL_ADAPTER !== 'mock' ? createEmailAdapter(env) : createMockMailer();
  cached = {
    store,
    mailer,
    captcha: createCaptcha({ adapter: env.CAPTCHA_ADAPTER }),
    rateLimiter: createMemoryRateLimiter(),
    programCodes: siteData.programCodes,
    cities: siteData.cities,
    allowedOrigins: String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    consentVersion: env.CONSENT_VERSION || 'v1',
    logger: { info: (entry) => console.log(JSON.stringify({ fn: 'enquiry', ...entry })) },
  };
  return cached;
}
