import { describe, expect, it } from 'vitest';
import {
  HOSTING_LINK_RIDESHARE_LABEL,
  HOSTING_PUBLISH_SUCCESS_BODY,
  HOSTING_PUBLISH_SUCCESS_TITLE,
  HOSTING_PUBLISH_VIEW_ON_MAP,
  PARTICIPANTS_SPOTS_QUESTION,
} from './createFlowCopy';

describe('createFlowCopy (hosting hiking/camping)', () => {
  it('uses Participants copy for structured spot step', () => {
    expect(PARTICIPANTS_SPOTS_QUESTION).toBe('How many spots available?');
  });

  it('describes post-publish map focus and optional carpool', () => {
    expect(HOSTING_PUBLISH_SUCCESS_TITLE).toBeTruthy();
    expect(HOSTING_PUBLISH_SUCCESS_BODY).toMatch(/map/i);
    expect(HOSTING_PUBLISH_SUCCESS_BODY).toMatch(/share/i);
    expect(HOSTING_PUBLISH_SUCCESS_BODY).toMatch(/ride/i);
    expect(HOSTING_PUBLISH_VIEW_ON_MAP).toBe('View on map');
    expect(HOSTING_LINK_RIDESHARE_LABEL).toBe('Link rideshare');
  });
});
