import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('facility map peek footer', () => {
  it('uses View Details + Update instead of plan trip / trip alerts', () => {
    const actions = read('src/explore/ui/peek/facility/FacilityPeekActions.tsx');
    const card = read('src/explore/ui/peek/PlacePeekCard.tsx');
    expect(actions).toMatch(/FACILITY_PEEK_FOOTER_VIEW_DETAILS/);
    expect(actions).toMatch(/FACILITY_PEEK_FOOTER_UPDATE/);
    expect(actions).toMatch(/FACILITY_DETAIL_REPORT_SECTION_ID/);
    expect(actions).not.toMatch(/PLACE_PEEK_FOOTER_PLAN_TRIP/);
    expect(actions).not.toMatch(/useExploreWishlistSave/);
    expect(card).toMatch(/card\.source === 'facility'/);
    expect(card).toMatch(/FacilityPeekActions/);
  });
});
