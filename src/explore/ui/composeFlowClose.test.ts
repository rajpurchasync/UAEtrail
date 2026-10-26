import { describe, expect, it, vi } from 'vitest';
import {
  requestComposeFlowClose,
  runComposeFlowClose,
  setComposeDiscardConfirmHandler,
} from './composeFlowClose';

describe('requestComposeFlowClose', () => {
  it('closes without confirm when there is no draft', () => {
    const close = vi.fn();
    expect(requestComposeFlowClose({ hasDraft: false, inProgress: true }, close)).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });
});

describe('runComposeFlowClose', () => {
  it('closes immediately when not in progress', () => {
    const close = vi.fn();
    expect(runComposeFlowClose(false, close)).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });

  it('delegates to in-app confirm when in progress', () => {
    const close = vi.fn();
    const handler = vi.fn();
    setComposeDiscardConfirmHandler(handler);
    expect(runComposeFlowClose(true, close)).toBe(false);
    expect(handler).toHaveBeenCalledWith(close);
    expect(close).not.toHaveBeenCalled();
    setComposeDiscardConfirmHandler(null);
  });
});
