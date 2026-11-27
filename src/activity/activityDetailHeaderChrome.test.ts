import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailHeaderChrome } from './activityDetailHeaderChrome';

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

describe('resolveActivityDetailHeaderChrome', () => {
  it('uses linked place kind on hero chrome when venue is set', () => {
    const chrome = resolveActivityDetailHeaderChrome(base(), null);
    expect(chrome.label).toBe('Venue');
    expect(chrome.mark).toBeUndefined();
    expect(chrome.emoji).not.toBe('📍');
  });

  it('uses scheduled activity kind when no linked place name', () => {
    const chrome = resolveActivityDetailHeaderChrome(
      base({ location: { name: '', activityType: 'event' } }),
      null
    );
    expect(chrome.label).toBe('Hiking');
    expect(chrome.mark).toBe('hiking');
  });

  it('maps rideshare to car mark', () => {
    const chrome = resolveActivityDetailHeaderChrome(
      base({ activityType: 'rideshare', location: undefined }),
      null
    );
    expect(chrome.mark).toBe('rideshare');
    expect(chrome.label).toBe('Rideshare');
  });
});
