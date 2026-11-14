import { describe, expect, it, vi } from 'vitest';
import { applyPeekJoinOpenAfterClick } from './resolvePeekJoinOpenAfterClick';

describe('applyPeekJoinOpenAfterClick', () => {
  const actions = () => ({
    openJoinModal: vi.fn(),
    setShowWithdraw: vi.fn(),
  });

  it('opens the join modal while context is loading when state is open', () => {
    const a = actions();
    expect(
      applyPeekJoinOpenAfterClick({ kind: 'open' }, true, a)
    ).toBe('opened');
    expect(a.openJoinModal).toHaveBeenCalledTimes(1);
  });

  it('waits while loading when join is not open', () => {
    const a = actions();
    expect(
      applyPeekJoinOpenAfterClick(
        { kind: 'pending', requestId: 'r1', status: 'pending' },
        true,
        a
      )
    ).toBe('waiting');
    expect(a.openJoinModal).not.toHaveBeenCalled();
  });

  it('opens withdraw when already pending', () => {
    const a = actions();
    expect(
      applyPeekJoinOpenAfterClick(
        { kind: 'pending', requestId: 'r1', status: 'pending' },
        false,
        a
      )
    ).toBe('withdraw');
    expect(a.setShowWithdraw).toHaveBeenCalledWith(true);
  });
});