import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const read = (relativePath: string) => readFileSync(join(root, relativePath), 'utf8');

/** Retired after consumer scroll template — must not reappear under detail/. */
const RETIRED_ACTIVITY_DETAIL_MODULES = [
  'src/components/activity/detail/ActivityTransportStrip.tsx',
  'src/components/activity/detail/ActivityDetailPhotoGallery.tsx',
  'src/components/activity/detail/ActivityDetailPublishedFacts.tsx',
  'src/components/activity/detail/ActivityDetailMarketingFold.tsx',
  'src/components/activity/detail/ActivityDetailEngagementStrips.tsx',
  'src/components/activity/detail/ActivityDetailMeetingPointAffordance.tsx',
  'src/components/activity/detail/ActivityDetailParticipantsAffordance.tsx',
  'src/components/activity/detail/ActivityDetailParticipationAffordances.tsx',
  'src/components/activity/detail/ActivityDetailParticipantRosterSection.tsx',
  'src/activity/activityDetailScrollEssentialChips.ts',
  'src/components/activity/detail/ActivityDetailTabBar.tsx',
  'src/components/activity/detail/ActivityDetailMobileHero.tsx',
  'src/components/activity/detail/activityDetailTabPanelClass.ts',
];

describe('activityDetailUiHygieneGuard', () => {
  it('AD-HYG-01: retired consumer-detail shim modules are removed', () => {
    const present = RETIRED_ACTIVITY_DETAIL_MODULES.filter((path) => existsSync(join(root, path)));
    expect(present).toEqual([]);
  });

  it('AD-HYG-02: public route uses section template; embed keeps the manage body', () => {
    expect(read('src/activity/detail/templates/ActivityDetailPageShell.tsx')).not.toMatch(/scrollDetailLayout/);
    expect(read('src/components/activity/ActivityDetailView.tsx')).toMatch(/ActivityDetailSections/);
    expect(read('src/components/activity/detail/ActivityDetailBody.tsx')).toMatch(/publicDetail/);
  });

  it('AD-HYG-03: view model resolves via .tsx (Vite extensionless shim only)', () => {
    const shim = read('src/components/activity/detail/useActivityDetailViewModel.ts');
    expect(shim).toMatch(/useActivityDetailViewModel\.tsx/);
    expect(existsSync(join(root, 'src/components/activity/detail/useActivityDetailViewModel.tsx'))).toBe(
      true
    );
  });

  it('AD-HYG-04: legacy Explore peek monoliths stay deleted', () => {
    for (const path of [
      'src/explore/ui/ExploreItemPeekParts.tsx',
      'src/explore/ui/ExploreItemSheet.tsx',
      'src/explore/ui/ExplorePlacePeekActions.tsx',
    ]) {
      expect(existsSync(join(root, path))).toBe(false);
    }
  });
});
