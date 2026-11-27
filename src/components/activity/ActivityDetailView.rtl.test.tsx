import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityDetailView } from './ActivityDetailView';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('../../hooks/useHostParticipantReviewHints', () => ({
  useHostParticipantReviewHints: () => ({ hints: [], loading: false }),
}));

vi.mock('../../activity/useActivityDetailMapPeekHandlers', () => ({
  useActivityDetailMapPeekHandlers: () => ({}),
}));

vi.mock('./detail/useActivityDetailJoinSurfaces', () => ({
  useActivityDetailJoinSurfaces: () => ({
    joinUiState: { tone: 'open' as const, label: "I'm going" },
    sharePayload: { title: 'Smoke hike', text: '', path: '/activity/act-smoke' },
    stickyFooter: null,
    sidebarJoin: null,
    planRequestManagePanel: null,
    partyEditPanel: null,
  }),
}));

vi.mock('../ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ui')>();
  return {
    ...actual,
    ShareButton: () => null,
  };
});

vi.mock('../mobile/MobileDetailScrollShell', () => ({
  MobileDetailScrollShell: ({ children }: { children?: ReactNode }) => (
    <div data-testid="public-detail-scroll">{children}</div>
  ),
}));

vi.mock('../mobile/MobileDetailShell', () => ({
  MobileDetailShell: ({
    children,
    banner,
  }: {
    children?: ReactNode;
    banner?: { title?: string };
  }) => (
    <div data-testid="mobile-detail-shell" data-banner-title={banner?.title ?? ''}>
      {children}
    </div>
  ),
}));

vi.mock('../../activity/detail/templates/ActivityDetailSections', () => ({
  ActivityDetailSections: ({ model }: { model: { activityTitle: string; publicDetail: boolean } }) => (
    <div data-testid="activity-detail-sections" data-public-detail={String(model.publicDetail)}>
      {model.activityTitle}
    </div>
  ),
}));

vi.mock('../../activity/activityDetailHeaderChrome', () => ({
  resolveActivityDetailHeaderChrome: () => null,
}));

const renderDetail = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

const activity = {
  id: 'act-smoke',
  title: 'Smoke hike',
  activityType: 'hiking',
  locationName: 'Hatta',
  date: '2026-02-01',
  status: 'published',
} as ActivityDetailDTO;

describe('ActivityDetailView (RTL integration)', () => {
  afterEach(() => cleanup());

  it('renders embedded grid via real view model', () => {
    renderDetail(<ActivityDetailView activity={activity} layout="embedded" />);
    expect(screen.getByText('About this activity')).toBeInTheDocument();
    expect(screen.getAllByText('Hatta').length).toBeGreaterThan(0);
  });

  it('public consumer page wires real view model into sections template', () => {
    renderDetail(<ActivityDetailView activity={activity} layout="page" detailKind="hiking" />);
    const sections = screen.getByTestId('activity-detail-sections');
    expect(sections).toHaveTextContent('Smoke hike');
    expect(sections).toHaveAttribute('data-public-detail', 'true');
    expect(screen.getByTestId('public-detail-scroll')).toBeInTheDocument();
  });

  it('preview mode uses mobile shell with title chrome from view model', () => {
    renderDetail(<ActivityDetailView activity={activity} layout="page" previewMode />);
    const shell = screen.getByTestId('mobile-detail-shell');
    expect(shell).toHaveAttribute('data-banner-title', 'Smoke hike');
    expect(within(shell).getByText('About this activity')).toBeInTheDocument();
  });

  it('requiresSignIn keeps public template but hides place crew surfaces in view model', () => {
    renderDetail(<ActivityDetailView activity={activity} layout="page" requiresSignIn />);
    expect(screen.getByTestId('activity-detail-sections')).toHaveAttribute('data-public-detail', 'true');
    expect(screen.queryByText(/crew/i)).not.toBeInTheDocument();
  });
});