import { describe, expect, it } from 'vitest';
import {
  formatExploreMapClusterTooltipLabel,
  formatExploreMapPinDateShort,
  formatExploreMapPinTooltipLabel,
  isScheduledActivityMapPin,
} from './exploreMapPinTooltip';

describe('exploreMapPinTooltip', () => {
  it('formats compact schedule dates', () => {
    expect(formatExploreMapPinDateShort('2026-11-25')).toBe('25Nov');
    expect(formatExploreMapPinDateShort('')).toBeNull();
  });

  it('builds tooltip for hosted activity pins only', () => {
    expect(
      formatExploreMapPinTooltipLabel({
        name: 'Jebel Jais Sunrise',
        scheduleDate: '2026-11-25',
        source: 'activity',
        activityMode: 'hosted',
      })
    ).toBe('Jebel Jais Sunrise · 25Nov');

    expect(
      formatExploreMapPinTooltipLabel({
        name: 'Trail spot',
        scheduleDate: '2026-11-25',
        source: 'venue',
      })
    ).toBeNull();
  });

  it('classifies scheduled activity pins', () => {
    expect(isScheduledActivityMapPin({ source: 'activity', activityMode: 'hosted' })).toBe(true);
    expect(isScheduledActivityMapPin({ source: 'venue' })).toBe(false);
  });

  it('formats cluster tooltips by hike / camping / other counts', () => {
    expect(
      formatExploreMapClusterTooltipLabel([
        { kind: 'hiking', stackCount: 1 },
        { kind: 'camping', stackCount: 2 },
        { kind: 'event', stackCount: 3 },
      ])
    ).toBe('1-Hike, 2-Camping, 3-Other');

    expect(formatExploreMapClusterTooltipLabel([{ kind: 'hiking', stackCount: 3 }])).toBe('3-Hike');
    expect(formatExploreMapClusterTooltipLabel([])).toBeNull();
  });
});
