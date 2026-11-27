import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ActivityDetailView } from './ActivityDetailView';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('../../activity/useActivityDetailMapPeekHandlers', () => ({
  useActivityDetailMapPeekHandlers: () => ({}),
}));

const viewModelState = vi.hoisted(() => ({
  isEmbedded: true,
  publicDetail: false,
  showInviteShare: false,
  activity: { id: 'act-smoke', title: 'Smoke hike', activityType: 'hiking' },
  previewMode: false,
  activityTitle: 'Smoke hike',
  titleChromeLine: 'Smoke hike',
  stickyFooter: null,
  peekParityCard: null,
  heroImage: '',
}));

vi.mock('./detail/useActivityDetailViewModel', () => ({
  useActivityDetailViewModel: () => viewModelState,
}));

vi.mock('./detail/ActivityDetailBody', () => ({
  ActivityDetailBody: () => <div data-testid="activity-detail-body">embedded</div>,
}));

vi.mock('../mobile/MobileDetailScrollShell', () => ({
  MobileDetailScrollShell: ({ children }: { children?: ReactNode }) => (
    <div data-testid="public-detail-scroll">{children}</div>
  ),
}));

vi.mock('../mobile/MobileDetailShell', () => ({
  MobileDetailShell: ({ children }: { children?: ReactNode }) => (
    <div data-testid="mobile-detail-shell">{children}</div>
  ),
}));

vi.mock('../../activity/detail/templates/ActivityDetailSections', () => ({
  ActivityDetailSections: () => <div data-testid="activity-detail-sections" />,
}));

vi.mock('../../activity/activityDetailHeaderChrome', () => ({
  resolveActivityDetailHeaderChrome: () => null,
}));

const activity = {
  id: 'act-smoke',
  title: 'Smoke hike',
  activityType: 'hiking',
} as ActivityDetailDTO;

const defaultViewModel = () => ({
  isEmbedded: true,
  publicDetail: false,
  showInviteShare: false,
  activity: { id: 'act-smoke', title: 'Smoke hike', activityType: 'hiking' },
  previewMode: false,
  activityTitle: 'Smoke hike',
  titleChromeLine: 'Smoke hike',
  stickyFooter: null,
  peekParityCard: null,
  heroImage: '',
});

describe('ActivityDetailView (RTL smoke)', () => {
  afterEach(() => cleanup());

  it('renders embedded shell via ActivityDetailBody', () => {
    Object.assign(viewModelState, defaultViewModel(), { isEmbedded: true, publicDetail: false });
    render(
      <MemoryRouter>
        <ActivityDetailView activity={activity} layout="embedded" />
      </MemoryRouter>
    );
    expect(screen.getByTestId('activity-detail-body')).toBeInTheDocument();
  });

  it('renders public scroll template when publicDetail is set', () => {
    Object.assign(viewModelState, defaultViewModel(), { isEmbedded: false, publicDetail: true });
    render(
      <MemoryRouter>
        <ActivityDetailView activity={activity} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('public-detail-scroll')).toBeInTheDocument();
    expect(screen.getByTestId('activity-detail-sections')).toBeInTheDocument();
  });

  it('renders classic mobile shell when not embedded and not publicDetail', () => {
    Object.assign(viewModelState, defaultViewModel(), {
      isEmbedded: false,
      publicDetail: false,
      previewMode: true,
    });
    render(
      <MemoryRouter>
        <ActivityDetailView activity={activity} previewMode />
      </MemoryRouter>
    );
    const shell = screen.getByTestId('mobile-detail-shell');
    expect(shell).toBeInTheDocument();
    expect(within(shell).getByTestId('activity-detail-body')).toBeInTheDocument();
  });
});