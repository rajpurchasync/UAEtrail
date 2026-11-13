import { PlaceDetailSections } from '../../place/detail/templates/PlaceDetailSections';
import type { PlaceDetailSectionsProps } from '../../place/detail/templates/PlaceDetailSections';
import { APP_PAGE_MIN_H_CLASS } from '../../config/layoutScroll';

/**
 * Place entity detail shell — scroll layout aligned with activity `ActivityDetailPageShell`.
 * Route: `*PlaceDetailPage` → `PlaceDetailPage` → this shell.
 */
export const PlaceDetailPageShell = (props: PlaceDetailSectionsProps) => (
  <div className={`${APP_PAGE_MIN_H_CLASS} flex h-full min-h-0 flex-1 flex-col overflow-hidden`}>
    <PlaceDetailSections {...props} />
  </div>
);
