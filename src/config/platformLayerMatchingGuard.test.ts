import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformLayerMatchingGuard (PLS-4)', () => {
  it('LAYER-13: matching context owns wishlist + availability match modules', () => {
    const manifest = JSON.parse(read('scripts/bounded-context-manifest.json')) as {
      contexts: { id: string; apiFiles?: string[] }[];
    };
    const matching = manifest.contexts.find((c) => c.id === 'matching');
    expect(matching?.apiFiles).toEqual(
      expect.arrayContaining([
        'apps/api/src/services/matching/index.ts',
        'apps/api/src/services/matching/wishlist-match-notify.ts',
        'apps/api/src/services/matching/availability-hosted-match.ts',
      ])
    );
    const engagement = manifest.contexts.find((c) => c.id === 'engagement');
    expect(engagement?.apiFiles ?? []).not.toContain('apps/api/src/services/wishlist-alerts.ts');
    expect(existsSync(join(ROOT, 'apps/api/src/services/matching/wishlist-match-notify.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'apps/api/src/services/matching/availability-hosted-match.ts'))).toBe(true);
  });

  it('LAYER-14: publish hot paths import matching barrel (not engagement-only shims)', () => {
    const store = read('apps/api/src/lib/activities-store.ts');
    expect(store).toMatch(/services\/matching\/index\.js/);
    expect(store).not.toMatch(/wishlist-alerts\.js/);
    expect(store).not.toMatch(/availability-hosted-match-notifications\.js/);
    const commands = read('apps/api/src/services/me-availability-commands.ts');
    expect(commands).toMatch(/from '\.\/matching\/index\.js'/);
    expect(commands).not.toMatch(/wishlist-alerts/);
    expect(commands).not.toMatch(/availability-hosted-match-notifications/);
  });

  it('LAYER-14b (GW-2): matching notify shims deleted — barrel only', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/services/wishlist-alerts.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'apps/api/src/services/availability-hosted-match-notifications.ts'))).toBe(
      false
    );
  });

  it('LAYER-15: Plan match-preview uses matching predicates (not duplicate filter)', () => {
    const preview = read('apps/api/src/services/member-availability-match-preview.ts');
    expect(preview).toMatch(/matching\/hosted-availability-fit/);
    expect(existsSync(join(ROOT, 'apps/api/src/services/matching/hosted-availability-fit.ts'))).toBe(true);
  });
});