import {
  activityGuideCountLabel,
  type PublishingProfileKind,
  resolveActivityPublisherChip,
} from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { discoveryCardIsAvailabilityPin } from './discoveryCardModel';
import { browseCardHostName } from './discoverySessionListFeed';

/** Trust chips under the host name — not navigation hints. */
export const resolveDiscoveryHostTrustLabels = (card: DiscoveryCardModel): string[] => {
  if (card.source !== 'activity' && card.source !== 'shop') return [];

  if (discoveryCardIsAvailabilityPin(card)) {
    return ['Community request'];
  }

  const kind: PublishingProfileKind | null | undefined = card.activity?.publishingProfileKind;
  const labels: string[] = [];

  switch (kind) {
    case 'pro_guide':
      labels.push('Verified host');
      break;
    case 'agency':
    case 'shop':
    case 'ecommerce':
    case 'hospitality':
    case 'partner':
      labels.push('Verified business');
      break;
    default:
      break;
  }

  const guideCount = card.activity?.acceptedGuideCount ?? card.activity?.guides?.length ?? 0;
  if (guideCount > 1) {
    labels.push(activityGuideCountLabel(guideCount));
  }

  if (card.source === 'shop') {
    return labels.length > 0 ? labels : ['Outdoor shop'];
  }

  return labels;
};

export const resolveDiscoveryHostedByPublisher = (card: DiscoveryCardModel) =>
  resolveActivityPublisherChip({
    publishingProfileKind: card.activity?.publishingProfileKind,
    tenantName: card.activity?.tenantName,
    tenantLogoUrl: card.activity?.tenantLogoUrl,
    hostName: browseCardHostName(card),
    hostAvatar: card.featuredPerson?.avatarUrl?.trim() || card.hostAvatar?.trim() || null,
    listHost: card.listHost,
  });