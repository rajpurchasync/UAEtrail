import { afterEach, describe, expect, it } from 'vitest';
import { isParticipantIntentStubWriteEnabled } from '../src/services/participant-intent-activity-readthrough.js';

const ENV_KEY = 'PARTICIPANT_INTENT_STUB_WRITE';

describe('PARTICIPANT_INTENT_STUB_WRITE default (M2d)', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('defaults to stub write off when env is unset', () => {
    delete process.env[ENV_KEY];
    expect(isParticipantIntentStubWriteEnabled()).toBe(false);
  });

  it('enables dual-write only when explicitly true', () => {
    process.env[ENV_KEY] = 'true';
    expect(isParticipantIntentStubWriteEnabled()).toBe(true);
  });
});
