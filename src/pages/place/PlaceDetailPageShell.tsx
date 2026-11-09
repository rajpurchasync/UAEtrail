import { PlaceConsumerDetailPage } from '../../place/detail/templates/PlaceConsumerDetailPage';
import type { PlaceConsumerDetailPageProps } from '../../place/detail/templates/PlaceConsumerDetailPage';
import { APP_PAGE_MIN_H_CLASS } from '../../config/layoutScroll';

/**
 * Consumer place detail shell — scroll layout aligned with activity `ActivityDetailPageShell`.
 * Route: `*PlaceDetailPage` → `PlaceDetailPage` → this shell.
 */
export const PlaceDetailPageShell = (props: PlaceConsumerDetailPageProps) => (
  <div
    className={`${APP_PAGE_MIN_H_CLASS} flex h-full min-h-0 flex-1 flex-col overflow-hidden`}
  >
    <PlaceConsumerDetailPage {...props} />
  </div>
);
