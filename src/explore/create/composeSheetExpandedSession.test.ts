import { afterEach, describe, expect, it } from 'vitest';
import {
  clearComposeSheetExpandedSession,
  readComposeSheetExpandedSession,
  writeComposeSheetExpandedSession,
} from './composeSheetExpandedSession';

describe('composeSheetExpandedSession', () => {
  afterEach(() => {
    clearComposeSheetExpandedSession();
  });

  it('defaults to collapsed', () => {
    expect(readComposeSheetExpandedSession()).toBe(false);
  });

  it('persists expanded until cleared', () => {
    writeComposeSheetExpandedSession(true);
    expect(readComposeSheetExpandedSession()).toBe(true);
    clearComposeSheetExpandedSession();
    expect(readComposeSheetExpandedSession()).toBe(false);
  });
});
