import { describe, expect, it } from 'vitest';
import {
  buildActivityDetailPageModel,
  resolveActivityDetailMobileTab,
  resolveActivityDetailShowTransportTab,
  resolveVisibleActivityDetailTabs,
} from './buildActivityDetailPageModel';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';

const baseActivity = (overrides: Partial<ActivityDetailDTO> = {}): ActivityDetailDTO =>
  ({
    id: 'a1',
    activityType: 'hiking',
    title: 'Hike',
    locationName: 'Hatta',
    date: '2026-01-01',
    status: 'published',
    ...overrides,
  }) as ActivityDetailDTO;

describe('buildActivityDetailPageModel', () => {
  it('prefers explicit detailKind over activityType mapping', () => {
    const model = buildActivityDetailPageModel(baseActivity({ activityType: 'hiking' }), {
      detailKind: 'rideshare',
    });
    expect(model.kind).toBe('rideshare');
    expect(model.tabVisibility.place).toBe(false);
    expect(model.template.defaultTab).toBe('transport');
  });

  it('rideshare template hides Place tab', () => {
    const model = buildActivityDetailPageModel(baseActivity({ activityType: 'rideshare' }));
    expect(model.tabVisibility.place).toBe(false);
    const visible = resolveVisibleActivityDetailTabs(model.tabVisibility, {
      showTransportTab: true,
    });
    expect(visible).not.toContain('place');
    expect(visible).toContain('transport');
  });

  it('rideshare keeps transport tab visible for reach-by and linked rides', () => {
    const activity = baseActivity({ activityType: 'rideshare', rideshareEnabled: true });
    const model = buildActivityDetailPageModel(activity, { detailKind: 'rideshare' });
    expect(resolveActivityDetailShowTransportTab(activity, model.kind)).toBe(true);
  });

  it('hiking hides transport tab without linked ride content', () => {
    const model = buildActivityDetailPageModel(baseActivity());
    expect(
      resolveActivityDetailShowTransportTab(baseActivity(), model.kind)
    ).toBe(false);
    const visible = resolveVisibleActivityDetailTabs(model.tabVisibility, {
      showTransportTab: false,
    });
    expect(visible).not.toContain('transport');
  });

  it('clamps deep-link place tab for rideshare outings', () => {
    const activity = baseActivity({ activityType: 'rideshare' });
    expect(
      resolveActivityDetailMobileTab(activity, { tabParam: 'place', detailKind: 'rideshare' })
    ).toBe('transport');
  });
});
