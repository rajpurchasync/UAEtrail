import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { useActivityDetailViewModel } from './useActivityDetailViewModel';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('../../../hooks/useHostParticipantReviewHints', () => ({
  useHostParticipantReviewHints: () => ({ hints: [], loading: false }),
}));

vi.mock('./useActivityDetailJoinSurfaces', () => ({
  useActivityDetailJoinSurfaces: () => ({
    joinUiState: { tone: 'open' as const, label: "I'm going" },
    sharePayload: { title: 'Hike', text: '', path: '/activity/a1' },
    stickyFooter: null,
    sidebarJoin: null,
    planRequestManagePanel: null,
    partyEditPanel: null,
  }),
}));

const activity = {
  id: 'a1',
  activityType: 'hiking',
  title: 'Hike',
  locationName: 'Hatta',
  date: '2026-01-01',
  status: 'published',
} as ActivityDetailDTO;

describe('useActivityDetailViewModel (contract)', () => {
  it('page layout surfaces public consumer detail', () => {
    const { result } = renderHook(() => useActivityDetailViewModel({ activity, layout: 'page' }));
    expect(result.current.isEmbedded).toBe(false);
    expect(result.current.publicDetail).toBe(true);
    expect(result.current.detailKind).toBe('hiking');
  });

  it('embedded layout is host-manage shell', () => {
    const { result } = renderHook(() =>
      useActivityDetailViewModel({ activity, layout: 'embedded' })
    );
    expect(result.current.isEmbedded).toBe(true);
    expect(result.current.publicDetail).toBe(false);
  });

  it('previewMode suppresses publicDetail on page layout', () => {
    const { result } = renderHook(() =>
      useActivityDetailViewModel({ activity, layout: 'page', previewMode: true })
    );
    expect(result.current.publicDetail).toBe(false);
  });

  it('requiresSignIn guest hides place crew body on consumer page', () => {
    const { result } = renderHook(() =>
      useActivityDetailViewModel({ activity, layout: 'page', requiresSignIn: true })
    );
    expect(result.current.publicDetail).toBe(true);
    expect(result.current.showPlaceCrewBody).toBe(false);
    expect(result.current.showPlaceLockedOnMobile).toBe(true);
  });
});