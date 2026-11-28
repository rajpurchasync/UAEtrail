import { describe, expect, it } from 'vitest';
import {
  memberHomeCommunitySeeAllPath,
  memberHomeFindCompanyPath,
  memberHomeFindPlacesPath,
  memberHomeHireProfessionalsPath,
  memberHomeTripsSeeAllPath,
} from './memberHomePaths';

describe('memberHomePaths', () => {
  it('routes intent tiles into existing discovery surfaces', () => {
    expect(memberHomeFindPlacesPath()).toMatch(/explore|list/);
    expect(memberHomeFindCompanyPath()).toMatch(/listCat=people|people/);
    expect(memberHomeHireProfessionalsPath()).toMatch(/professional/);
    expect(memberHomeHireProfessionalsPath()).toMatch(/guide/);
    expect(memberHomeHireProfessionalsPath()).not.toMatch(/become-host/);
  });

  it('sends see-all into trips list and community discover', () => {
    expect(memberHomeTripsSeeAllPath()).toMatch(/listCat=activities|activities|explore/);
    expect(memberHomeCommunitySeeAllPath()).toMatch(/community|people/);
  });
});
