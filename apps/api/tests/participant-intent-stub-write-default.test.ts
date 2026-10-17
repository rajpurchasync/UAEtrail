import { afterEach, describe, expect, it } from 'vitest';
import { isParticipantIntentStubWriteEnabled } from '../src/services/participant-intent-activity-readthrough.js';

const ENV_KEY = 'PARTICIPANT_INTENT_STUB_WRITE';

describe('PARTICIPANT_INTENT_STUB_WRITE (COH-01 retired)', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('stub write is permanently disabled', () => {
    expect(isParticipantIntentStubWriteEnabled()).toBe(false);
  });

  it('ignores legacy env rollback flag', () => {
    process.env[ENV_KEY] = 'true';
    expect(isParticipantIntentStubWriteEnabled()).toBe(false);
  });
});
