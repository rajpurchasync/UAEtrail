import { afterEach, describe, expect, it } from 'vitest';
import { hostCompose } from '../compose';
import {
  buildComposeAuthReturnPath,
  clearGuestComposeResumeSession,
  readGuestComposeResumeSession,
  writeGuestComposeResumeSession,
} from './guestComposeResume';

describe('guestComposeResume', () => {
  afterEach(() => {
    clearGuestComposeResumeSession();
  });

  it('builds return path with compose wizard on current surface', () => {
    const path = buildComposeAuthReturnPath(
      '/explore',
      '?list=1&filter=hiking',
      hostCompose('rideshare')
    );
    expect(path).toContain('/explore');
    expect(path).toContain('list=1');
    expect(path).toContain('filter=hiking');
    expect(path).toContain('compose=host%3Arideshare');
  });

  it('persists resume payload in session', () => {
    writeGuestComposeResumeSession({
      composeWire: 'host:rideshare',
      fromMenu: true,
    });
    expect(readGuestComposeResumeSession()).toEqual({
      composeWire: 'host:rideshare',
      fromMenu: true,
    });
  });
});
