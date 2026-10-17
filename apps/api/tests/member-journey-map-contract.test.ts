import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('Member journey map HTTP contract', () => {
  it('read model is GET /me/journey-map (not legacy /me/trips/map)', () => {
    const routes = read('src/routes/user/registerMeMapPinsRoutes.ts');
    expect(routes).toContain("'/me/journey-map'");
    expect(routes).not.toContain("'/me/trips/map'");
    expect(routes).toContain("'/me/map-pins'");
    expect(routes).toContain('me-map-pins-read');
    const readService = read('src/services/me-map-pins-read.ts');
    expect(readService).toContain('buildMemberJourneyMap');
  });
});
