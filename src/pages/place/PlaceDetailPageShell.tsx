import { PlaceDetailSections } from '../../place/detail/templates/PlaceDetailSections';
import type { PlaceDetailSectionsProps } from '../../place/detail/templates/PlaceDetailSections';

/**
 * Consumer place detail shell — scroll layout aligned with activity `ActivityDetailPageShell`.
 * Route: `*PlaceDetailPage` → `PlaceDetailPage` → this shell.
 */
export const PlaceDetailPageShell = (props: PlaceDetailSectionsProps) => (
  <PlaceDetailSections {...props} />
);
