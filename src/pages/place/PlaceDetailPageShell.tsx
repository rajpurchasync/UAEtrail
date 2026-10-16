import { PlaceConsumerDetailPage } from '../../place/detail/templates/PlaceConsumerDetailPage';
import type { PlaceConsumerDetailPageProps } from '../../place/detail/templates/PlaceConsumerDetailPage';

/**
 * Consumer place detail shell — scroll layout aligned with activity `ActivityDetailPageShell`.
 * Route: `*PlaceDetailPage` → `PlaceDetailPage` → this shell.
 */
export const PlaceDetailPageShell = (props: PlaceConsumerDetailPageProps) => (
  <PlaceConsumerDetailPage {...props} />
);
