import { describe, expect, it } from 'vitest';
import {
  ORGANIZE_LINK_CARPOOL_LABEL,
  ORGANIZE_PUBLISH_SUCCESS_BODY,
  ORGANIZE_PUBLISH_SUCCESS_TITLE,
  ORGANIZE_PUBLISH_VIEW_ON_MAP,
  PARTICIPANTS_SPOTS_QUESTION,
} from './createFlowCopy';

describe('createFlowCopy (organize hiking/camping)', () => {
  it('uses Participants copy for structured spot step', () => {
    expect(PARTICIPANTS_SPOTS_QUESTION).toBe('How many spots available?');
  });

  it('describes post-publish map focus and optional carpool', () => {
    expect(ORGANIZE_PUBLISH_SUCCESS_TITLE).toBeTruthy();
    expect(ORGANIZE_PUBLISH_SUCCESS_BODY).toMatch(/map/i);
    expect(ORGANIZE_PUBLISH_SUCCESS_BODY).toMatch(/rideshare|carpool/i);
    expect(ORGANIZE_PUBLISH_VIEW_ON_MAP).toBe('View on map');
    expect(ORGANIZE_LINK_CARPOOL_LABEL).toBe('Link carpool');
  });
});
