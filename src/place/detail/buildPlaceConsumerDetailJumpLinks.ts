import type { ConsumerDetailJumpLink } from '../../detail/shell/ConsumerDetailSectionJumpNav';
import { PLACE_PEEK_SCHEDULED } from '../../content/placePeekCopy';
import {
  CONSUMER_DETAIL_KEY_FACTS_LABEL,
  CONSUMER_DETAIL_OVERVIEW_LABEL,
} from '../../content/consumerDetailSectionLabels';

/** Jump chips aligned to sections mounted in `PlaceDetailSections`. */
export type PlaceConsumerDetailJumpInput = {
  guestPreview?: boolean;
  hasAbout: boolean;
  showSeason: boolean;
  showTransport: boolean;
  showNearby: boolean;
  showScheduled: boolean;
  showGuide: boolean;
};

export const buildPlaceConsumerDetailJumpLinks = (
  input: PlaceConsumerDetailJumpInput
): ConsumerDetailJumpLink[] => {
  const links: ConsumerDetailJumpLink[] = [];
  const push = (link: ConsumerDetailJumpLink) => {
    links.push(link);
  };

  push({
    href: '#place-detail-at-a-glance',
    label: CONSUMER_DETAIL_KEY_FACTS_LABEL,
    sectionId: 'place-detail-at-a-glance',
  });

  if (input.guestPreview) {
    if (input.hasAbout) {
      push({
        href: '#place-detail-about',
        label: CONSUMER_DETAIL_OVERVIEW_LABEL,
        sectionId: 'place-detail-about',
      });
    }
    return links;
  }

  if (input.hasAbout) {
    push({
      href: '#place-detail-about',
      label: CONSUMER_DETAIL_OVERVIEW_LABEL,
      sectionId: 'place-detail-about',
    });
  }

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

  if (input.showScheduled) {
    push({
      href: '#place-detail-scheduled',
      label: PLACE_PEEK_SCHEDULED,
      sectionId: 'place-detail-scheduled',
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