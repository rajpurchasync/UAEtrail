import { describe, expect, it } from 'vitest';
import {
  parseCrewsAvailabilityShapeFilter,
  serializeCrewsAvailabilityShapeFilter,
} from './crewsOpenSegment';

describe('crewsOpenSegment availability shape', () => {
  it('defaults to all', () => {
    expect(parseCrewsAvailabilityShapeFilter(null)).toBe('all');
  });

  it('migrates legacy open/marked wire', () => {
    expect(parseCrewsAvailabilityShapeFilter('open')).toBe('fixed');
    expect(parseCrewsAvailabilityShapeFilter('marked')).toBe('flexible');
  });

  it('serializes flexible and fixed', () => {
    expect(serializeCrewsAvailabilityShapeFilter('all')).toBeNull();
    expect(serializeCrewsAvailabilityShapeFilter('flexible')).toBe('flexible');
    expect(serializeCrewsAvailabilityShapeFilter('fixed')).toBe('fixed');
  });
});