import { TrailPlaceDetailHeroStats } from '../../place/detail/composers/TrailPlaceDetailHeroStats';
import { PlaceDetailPage } from '../PlaceDetailPage';

/** Hiking place catalog detail — route `/trail/:id`. */
export const HikingPlaceDetailPage = () => (
  <PlaceDetailPage kind="trail" heroKindSection={TrailPlaceDetailHeroStats} />
);
