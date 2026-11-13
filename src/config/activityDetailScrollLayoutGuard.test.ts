import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

const TEMPLATE = 'src/activity/detail/templates/ActivityDetailSections.tsx';

describe('activityDetailScrollLayoutGuard', () => {
  it('public activity detail uses single consumer template module', () => {
    expect(() => read('src/activity/detail/activityDetailKindFactLine.ts')).toThrow();
    const template = read(TEMPLATE);
    expect(template).toMatch(/export const ActivityDetailSections/);
    expect(template).toMatch(/data-activity-scroll-detail-template/);
    expect(template).toMatch(/model\.sections/);
    expect(template).not.toMatch(/showPublishedCatalog: true/);
    expect(template).toMatch(/peekParityCard/);
    expect(template).toMatch(/title="Instructions"/);
    expect(template).toMatch(/title="Getting there"/);
    expect(template).toMatch(/ActivityPeekLinkedTransport/);
    expect(template).not.toMatch(/ActivityDetailPhotoGallery/);
    expect(template).not.toMatch(/ActivityDetailConsumerPlanScroll/);
    expect(template).toMatch(/ActivityDetailPlanColumn/);
    expect(template).toMatch(/planSections/);
    expect(template).toMatch(/ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE/);

    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/ActivityDetailSections/);
    expect(view).toMatch(/MobileDetailScrollShell/);
    expect(read('src/components/mobile/MobileDetailScrollShell.tsx')).toMatch(
      /data-entity-detail-scroll-shell/
    );
    expect(read('src/components/mobile/MobileDetailScrollShell.tsx')).toMatch(/data-entity-detail-scroll/);
    expect(read('src/activity/detail/activityDetailScrollAnchors.ts')).toMatch(/scrollEntityDetailToId/);
    expect(read('src/activity/detail/templates/ActivityDetailPageShell.tsx')).not.toMatch(
      /scrollDetailLayout/
    );
    expect(read('packages/shared-types/src/activity-detail-presentation.ts')).toMatch(
      /ActivityPresentationSectionsDTO/
    );
    expect(read('packages/shared-types/src/activity-detail-presentation.ts')).not.toMatch(
      /scrollLayout/
    );
  });

  it('legacy tab deep links scroll to consumer anchors from route loader', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/scrollActivityDetailSection/);
    expect(page).toMatch(/ACTIVITY_DETAIL_TAB_QUERY/);
    expect(read('src/activity/detail/activityDetailScrollAnchors.ts')).toMatch(
      /activity-detail-meeting-point/
    );
  });

  it('public route shell enables consumer layout without tab body', () => {
    const shell = read('src/activity/detail/templates/ActivityDetailPageShell.tsx');
    expect(shell).toMatch(/layout !== embedded/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/if \(model\.publicDetail\)/);
    expect(view).toMatch(/ActivityDetailBody/);
  });
});
