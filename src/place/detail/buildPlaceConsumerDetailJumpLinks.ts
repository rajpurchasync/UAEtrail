import type { ConsumerDetailJumpLink } from '../../detail/shell/ConsumerDetailSectionJumpNav';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';
import { PLACE_PEEK_SCHEDULED } from '../../content/placePeekCopy';
import {
  CONSUMER_DETAIL_DETAILS_LABEL,
  CONSUMER_DETAIL_KEY_FACTS_LABEL,
  CONSUMER_DETAIL_OVERVIEW_LABEL,
} from '../../content/consumerDetailSectionLabels';

export type PlaceConsumerDetailJumpInput = {
  guestPreview?: boolean;
  kind: PlaceDetailKind;
  hasAbout: boolean;
  showMapElevation: boolean;
  showSeason: boolean;
  showTransport: boolean;
  showNearby: boolean;
  showAmenities: boolean;
  showWeather: boolean;
  showScheduled: boolean;
  showRides: boolean;
  showGuide: boolean;
};

export const buildPlaceConsumerDetailJumpLinks = (
  input: PlaceConsumerDetailJumpInput
): ConsumerDetailJumpLink[] => {
  const links: ConsumerDetailJumpLink[] = [];
  const push = (link: ConsumerDetailJumpLink) => {
    links.push(link);
  };

  if (input.guestPreview) {
    push({
      href: '#place-detail-at-a-glance',
      label: CONSUMER_DETAIL_KEY_FACTS_LABEL,
      sectionId: 'place-detail-at-a-glance',
    });
    if (input.hasAbout) {
      push({
        href: '#place-detail-about',
        label: CONSUMER_DETAIL_OVERVIEW_LABEL,
        sectionId: 'place-detail-about',
      });
    }
    if (input.showRides) {
      push({
        href: '#place-detail-rides',
        label: 'Rides',
        sectionId: 'place-detail-rides',
      });
    }
    return links;
  }

  push({
    href: '#place-detail-at-a-glance',
    label: CONSUMER_DETAIL_KEY_FACTS_LABEL,
    sectionId: 'place-detail-at-a-glance',
  });

  if (input.hasAbout) {
    push({
      href: '#place-detail-about',
      label: CONSUMER_DETAIL_OVERVIEW_LABEL,
      sectionId: 'place-detail-about',
    });
  }

  if (input.showMapElevation) {
    push({
      href: '#place-detail-map-elevation',
      label: 'Map',
      sectionId: 'place-detail-map-elevation',
    });
  }

  push({
    href: '#place-detail-details',
    label: CONSUMER_DETAIL_DETAILS_LABEL,
    sectionId: 'place-detail-details',
  });

  if (input.showSeason) {
    push({
      href: '#place-detail-season',
      label: 'Season',
      sectionId: 'place-detail-season',
    });
  }

  if (input.showTransport) {
    push({
      href: '#place-detail-transport',
      label: 'Getting there',
      sectionId: 'place-detail-transport',
    });
  }

  if (input.showNearby) {
    push({
      href: '#place-detail-nearby',
      label: 'Nearby',
      sectionId: 'place-detail-nearby',
    });
  }

  if (input.showAmenities) {
    push({
      href: '#place-detail-amenities',
      label: 'Amenities',
      sectionId: 'place-detail-amenities',
    });
  }

  if (input.showWeather) {
    push({
      href: '#place-detail-safety',
      label: 'Safety',
      sectionId: 'place-detail-safety',
    });
  }

  if (input.showScheduled) {
    push({
      href: '#place-detail-scheduled',
      label: PLACE_PEEK_SCHEDULED,
      sectionId: 'place-detail-scheduled',
    });
  }

  if (input.showRides) {
    push({
      href: '#place-detail-rides',
      label: 'Rides',
      sectionId: 'place-detail-rides',
    });
  }

  if (input.showGuide) {
    push({
      href: '#place-guide',
      label: 'Guide',
      sectionId: 'place-guide',
    });
  }

  push({
    href: '#place-reviews',
    label: 'Reviews',
    sectionId: 'place-reviews',
  });

  return links;
};
