import { afterEach, describe, expect, it } from 'vitest';
import {
  readPersistedDetailSectionExpanded,
  writePersistedDetailSectionExpanded,
} from './consumerDetailSectionPersistence';

describe('consumerDetailSectionPersistence', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('defaults when nothing stored', () => {
    expect(readPersistedDetailSectionExpanded('activity:a1', 'activity-detail-weather', true)).toBe(true);
    expect(readPersistedDetailSectionExpanded('activity:a1', 'activity-detail-weather', false)).toBe(false);
  });

  it('remembers toggles per section for the same activity', () => {
    writePersistedDetailSectionExpanded('activity:a1', 'activity-detail-weather', false);
    writePersistedDetailSectionExpanded('activity:a1', 'activity-detail-getting-there', true);
    expect(readPersistedDetailSectionExpanded('activity:a1', 'activity-detail-weather', true)).toBe(false);
    expect(readPersistedDetailSectionExpanded('activity:a1', 'activity-detail-getting-there', true)).toBe(true);
    expect(readPersistedDetailSectionExpanded('activity:a2', 'activity-detail-weather', true)).toBe(true);
  });
});
