import { describe, expect, it } from 'vitest';
import { womenOnlyJoinBlockMessage } from './activity-audience-requirements';

describe('activity-audience-requirements copy', () => {
  it('womenOnlyJoinBlockMessage points members to App settings (not /profile/settings URL)', () => {
    const message = womenOnlyJoinBlockMessage('profile_gender_required');
    expect(message).toMatch(/App settings/i);
    expect(message).not.toMatch(/\/profile\/settings/);
    expect(message).toMatch(/Edit profile/i);
  });
});
