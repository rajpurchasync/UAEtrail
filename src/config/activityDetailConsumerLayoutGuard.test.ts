import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

const TEMPLATE = 'src/activity/detail/templates/ActivityConsumerDetailPage.tsx';

describe('activityDetailConsumerLayoutGuard', () => {
  it('public activity detail uses single consumer template module', () => {
    expect(() => read('src/activity/detail/activityDetailKindFactLine.ts')).toThrow();
    const template = read(TEMPLATE);
    expect(template).toMatch(/export const ActivityConsumerDetailPage/);
    expect(template).toMatch(/data-activity-consumer-detail-template/);
    expect(template).toMatch(/model\.consumerLayout/);
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
    expect(view).toMatch(/ActivityConsumerDetailPage/);
    expect(view).toMatch(/ActivityConsumerDetailModalShell/);
    expect(read('src/activity/detail/templates/ActivityConsumerDetailModalShell.tsx')).toMatch(
      /data-activity-detail-modal-shell/
    );
    expect(read('src/activity/detail/templates/ActivityDetailPageShell.tsx')).toMatch(
      /consumerDetailLayout/
    );
    expect(read('packages/shared-types/src/activity-detail-presentation.ts')).toMatch(
      /ActivityPresentationConsumerLayoutDTO/
    );
  });

  it('legacy tab deep links scroll to consumer anchors from route loader', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/scrollActivityDetailConsumerSection/);
    expect(page).toMatch(/ACTIVITY_DETAIL_TAB_QUERY/);
    expect(read('src/activity/detail/activityDetailConsumerAnchors.ts')).toMatch(
      /activity-detail-meeting-point/
    );
  });

  it('public route shell enables consumer layout without tab body', () => {
    const shell = read('src/activity/detail/templates/ActivityDetailPageShell.tsx');
    expect(shell).toMatch(/consumerDetailLayout/);
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/if \(consumerDetailLayout\)/);
    expect(view).toMatch(/ActivityDetailBody/);
  });
});
