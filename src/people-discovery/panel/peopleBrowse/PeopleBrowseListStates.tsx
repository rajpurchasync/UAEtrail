import type { ReactNode } from 'react';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import { ExploreListSkeleton } from '@/explore/ui/ExploreListSkeleton';

/** Empty state — People looking list. */
export const PeopleBrowseListEmpty = ({ children }: { children: ReactNode }) => (
  <div className={`py-10 text-center text-sm font-medium ${EXPLORE_TYPE.muted}`}>{children}</div>
);

export const PeopleBrowseListLoading = ({ label }: { label?: string }) => (
  <div
    className="flex flex-col items-center px-2 py-6 sm:py-8"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="w-full max-w-md">
      <ExploreListSkeleton rows={1} />
    </div>
    {label ? <p className={`mt-3 text-center text-sm font-medium ${EXPLORE_TYPE.muted}`}>{label}</p> : null}
  </div>
);

export const PeopleBrowseListError = ({ message }: { message: string }) => (
  <p className={`py-10 text-center text-sm font-medium text-red-600`}>{message}</p>
);
