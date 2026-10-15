import { EventPlaceDetailHeroStats } from '../../place/detail/composers/EventPlaceDetailHeroStats';
import { PlaceDetailPage } from '../PlaceDetailPage';

/** Event venue place detail — route `/venue/:id`. */
export const EventPlaceDetailPage = () => (
  <PlaceDetailPage kind="event" heroKindSection={EventPlaceDetailHeroStats} />
);
