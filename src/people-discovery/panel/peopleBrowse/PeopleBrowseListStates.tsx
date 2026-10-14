import type { ReactNode } from 'react';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import { ExploreListSkeleton } from '@/explore/ui/ExploreListSkeleton';

/** Empty state — same as map list (`ExploreBrowsePanel`). */
export const PeopleBrowseListEmpty = ({ children }: { children: ReactNode }) => (
  <div className={`py-10 text-center text-sm font-medium ${EXPLORE_TYPE.muted}`}>{children}</div>
);

export const PeopleBrowseListLoading = ({ rows = 5 }: { rows?: number }) => (
  <ExploreListSkeleton rows={rows} />
);

export const PeopleBrowseListError = ({ message }: { message: string }) => (
  <p className={`py-10 text-center text-sm font-medium text-red-600`}>{message}</p>
);
