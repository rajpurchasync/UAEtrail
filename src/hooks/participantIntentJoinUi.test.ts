import { describe, expect, it } from 'vitest';
import { resolveParticipantIntentJoinUiState } from './useParticipantIntentJoinContext';

describe('resolveParticipantIntentJoinUiState', () => {
  it('maps pending and approved requests', () => {
    expect(resolveParticipantIntentJoinUiState(null)).toEqual({ kind: 'open' });
    expect(
      resolveParticipantIntentJoinUiState({
        id: 'r1',
        intentId: 'i1',
        userId: 'u1',
        status: 'pending',
        note: null,
        createdAt: '',
        updatedAt: '',
      })
    ).toEqual({ kind: 'pending', requestId: 'r1', status: 'pending' });
    expect(
      resolveParticipantIntentJoinUiState({
        id: 'r2',
        intentId: 'i1',
        userId: 'u1',
        status: 'approved',
        note: null,
        createdAt: '',
        updatedAt: '',
      })
    ).toEqual({ kind: 'confirmed', requestId: 'r2' });
    expect(
      resolveParticipantIntentJoinUiState({
        id: 'r3',
        intentId: 'i1',
        userId: 'u1',
        status: 'rejected',
        note: null,
        createdAt: '',
        updatedAt: '',
      })
    ).toEqual({ kind: 'open' });
  });
});
