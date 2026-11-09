import { PlaceScrollDetailPage } from '../../place/detail/templates/PlaceScrollDetailPage';
import type { PlaceScrollDetailPageProps } from '../../place/detail/templates/PlaceScrollDetailPage';

/**
 * Consumer place detail shell — scroll layout aligned with activity `ActivityDetailPageShell`.
 * Route: `*PlaceDetailPage` → `PlaceDetailPage` → this shell.
 */
export const PlaceDetailPageShell = (props: PlaceScrollDetailPageProps) => (
  <PlaceScrollDetailPage {...props} />
);
