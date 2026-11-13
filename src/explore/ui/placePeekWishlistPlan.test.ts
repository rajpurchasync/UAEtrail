import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('place peek save → Plan wishlist (trip alerts)', () => {
  it('footer trip alerts writes wishlist (same store as PlanSavedSection)', () => {
    const actions = read('src/explore/ui/peek/place/PlacePeekActions.tsx');
    expect(actions).toMatch(/useExploreWishlistSave/);
    expect(actions).not.toMatch(/useExploreEntityFollow/);
    expect(actions).not.toMatch(/invalidateMeWishlistQueries/);
    expect(read('src/explore/ui/useExploreWishlistSave.ts')).toMatch(/invalidateMeWishlistQueries/);
    expect(read('src/components/plan/PlanSavedSection.tsx')).toMatch(/useMeWishlist/);
    expect(read('src/components/plan/PlanSavedSection.tsx')).toMatch(/isPlanWantToGoVenue/);
    expect(read('src/components/plan/PlanSavedSection.tsx')).not.toMatch(/explorePlacesPath/);
    expect(read('apps/api/src/services/wishlist-alerts.ts')).toMatch(/listWishlistSaversForLocation/);
    expect(read('src/utils/notificationRouting.ts')).toMatch(/wishlist_match/);
  });

  it('place peek hero uses wishlist save control', () => {
    const hero = read('src/explore/ui/peek/place/PlacePeekHero.tsx');
    expect(hero).toMatch(/ExploreWishlistSaveButton/);
    expect(hero).not.toMatch(/ExploreFollowButton/);
  });
});
