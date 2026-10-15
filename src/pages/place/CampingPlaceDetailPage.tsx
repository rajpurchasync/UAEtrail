import { CampPlaceDetailHeroStats } from '../../place/detail/composers/CampPlaceDetailHeroStats';
import { PlaceDetailPage } from '../PlaceDetailPage';

/** Camping place catalog detail — route `/camp/:id`. */
export const CampingPlaceDetailPage = () => (
  <PlaceDetailPage kind="camp" heroKindSection={CampPlaceDetailHeroStats} />
);
