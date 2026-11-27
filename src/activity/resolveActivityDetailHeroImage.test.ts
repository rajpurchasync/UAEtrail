import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailHeroImage } from './resolveActivityDetailHeroImage';

describe('resolveActivityDetailHeroImage', () => {
  it('prefers outing images then linked venue images', () => {
    const activity = {
      id: 'a1',
      activityType: 'hiking',
      images: ['https://cdn.example/1.jpg'],
      location: {
        images: ['https://cdn.example/trail.jpg'],
      },
    } as ActivityDetailDTO;
    expect(resolveActivityDetailHeroImage(activity).src).toBe('https://cdn.example/1.jpg');
    expect(
      resolveActivityDetailHeroImage({
        ...activity,
        images: [],
      } as ActivityDetailDTO).src
    ).toBe('https://cdn.example/trail.jpg');
  });

  it('returns typed fallback when no usable URLs (guest-redacted outings)', () => {
    const activity = {
      id: 'a2',
      activityType: 'hiking',
      title: 'Baqal Caves',
    } as ActivityDetailDTO;
    const { src, fallback } = resolveActivityDetailHeroImage(activity);
    expect(src).toMatch(/^https:\/\//);
    expect(fallback).toMatch(/^https:\/\//);
  });
});