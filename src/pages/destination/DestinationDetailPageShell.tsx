import type { ReactNode } from 'react';
import { APP_PAGE_MIN_H_CLASS } from '../../config/layoutScroll';

/**
 * Consumer area hub — scroll layout aligned with `PlaceDetailPageShell` / activity detail.
 */
export const DestinationDetailPageShell = ({ children }: { children: ReactNode }) => (
  <div className={`${APP_PAGE_MIN_H_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`}>{children}</div>
);
