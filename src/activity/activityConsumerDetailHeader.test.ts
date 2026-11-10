import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityConsumerDetailHeaderChrome } from './activityConsumerDetailHeader';

const base = (overrides: Partial<ActivityDetailDTO> = {}): ActivityDetailDTO =>
  ({
    id: 'a1',
    title: 'Morning hike',
    activityType: 'hiking',
    activityMode: 'hosted',
    location: {
      name: 'Some venue',
      activityType: 'event',
    },
    ...overrides,
  }) as ActivityDetailDTO;

describe('resolveActivityConsumerDetailHeaderChrome', () => {
  it('uses scheduled activity kind on hero chrome, not linked place pin', () => {
    const chrome = resolveActivityConsumerDetailHeaderChrome(base(), null);
    expect(chrome.label).toBe('Hiking');
    expect(chrome.mark).toBe('hiking');
    expect(chrome.emoji).not.toBe('📍');
  });

  it('maps rideshare to car mark', () => {
    const chrome = resolveActivityConsumerDetailHeaderChrome(
      base({ activityType: 'rideshare', location: undefined }),
      null
    );
    expect(chrome.mark).toBe('rideshare');
    expect(chrome.label).toBe('Rideshare');
  });
});
