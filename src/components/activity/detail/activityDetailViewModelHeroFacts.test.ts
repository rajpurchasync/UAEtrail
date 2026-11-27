import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailViewModelHeroFacts } from './activityDetailViewModelHeroFacts';

const activity = {
  id: 'a1',
  activityType: 'hiking',
  title: 'Hike',
  status: 'published',
  slotsAvailable: 3,
  slotsTotal: 8,
} as ActivityDetailDTO;

describe('resolveActivityDetailViewModelHeroFacts', () => {
  it('public consumer page uses marketing chips on the hero', () => {
    const { heroFactChips, consumerStatusChips } = resolveActivityDetailViewModelHeroFacts({
      activity,
      joinUiState: { tone: 'open', label: "I'm going" },
      previewMode: false,
      isHostUser: false,
      wireStrips: null,
      publicDetail: true,
      showMobileTabs: true,
    });
    expect(heroFactChips).toBe(consumerStatusChips);
  });

  it('embed prepends activity kind when mobile tabs show', () => {
    const { heroFactChips } = resolveActivityDetailViewModelHeroFacts({
      activity,
      joinUiState: { tone: 'open', label: "I'm going" },
      previewMode: false,
      isHostUser: false,
      wireStrips: null,
      publicDetail: false,
      showMobileTabs: true,
    });
    expect(heroFactChips[0]?.label).toMatch(/hiking/i);
  });
});