import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('explore seeking activities read contract', () => {
  it('exposes GET /explore/seeking-activities for people-discovery Looking for', () => {
    const registrar = read('src/routes/user/registerPublicPlaceRoutes.ts');
    expect(registrar).toMatch(/\/explore\/seeking-activities/);
    expect(registrar).toMatch(/loadExploreSeekingActivitiesForViewer/);
  });

  it('filters published seeking activities from explore map assembler', () => {
    const service = read('src/services/explore-seeking-activities-read.ts');
    expect(service).toMatch(/loadExploreMapItemsForMemberEngagement/);
    expect(service).toMatch(/exploreMapItemIsSeeking/);
  });
});
