import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EXPLORE_RIDESHARE_AVAILABLE_BADGE } from '../../explore/exploreRequirementBadges';
import { browseCardMeta, browseRowWhenDisplay } from './browseCardMeta';
import { LIST_FEED_CTA_CARPOOL } from '../listFeedCtaCopy';
import { resolveListFeedPosterRequirementLabels } from '../listFeedPosterStandard';
import { resolveActivityLinkedPlaceLogisticsLabels } from './venueBrowseFacts';

const TRIP_BROWSE_FACT_LIMIT = 5;
const SEEKING_LIST_POLICY_LABEL = 'Looking for';

export type TripBrowseCardCarpool = {
  label: string;
  path: string;
  exploreItemId: string | null;
};

export type TripBrowseCardCopy = {
  title: string;
  locationLine: string | null;
  whenLine: string | null;
  price: string | null;
  hostName: string | null;
  hostAvatar: string | null;
  soldOut: boolean;
  factLabels: string[];
  carpool: TripBrowseCardCarpool | null;
  placeLogisticsLabels: string[];
};

/** Trips browse bucket — when/price on the photo, host + labels in the body. */
export const resolveTripBrowseCardCopy = (card: DiscoveryCardModel): TripBrowseCardCopy => {
  const meta = browseCardMeta(card);
  const when = browseRowWhenDisplay(card);
  const clock = when?.time
    ?.replace(/\s*·\s*Same day.*$/i, '')
    .replace(/\s*\((?:fixed|flexible)\)\s*$/i, '')
    .trim() || null;
  const whenLine = when
    ? [when.date, clock].filter(Boolean).join(' · ')
    : meta.when;

  const linkedRides = card.kind === 'rideshare' ? [] : (card.linkedRideshares ?? []);
  const carpool: TripBrowseCardCarpool | null =
    linkedRides.length === 1
      ? {
          label: LIST_FEED_CTA_CARPOOL,
          path: linkedRides[0]!.path,
          exploreItemId: linkedRides[0]!.exploreItemId ?? null,
        }
      : linkedRides.length > 1
        ? {
            label: `${linkedRides.length} carpools available`,
            path: card.path,
            exploreItemId: card.id,
          }
        : null;

  const labels = resolveListFeedPosterRequirementLabels(card)
    .map((label) => (label === 'Seeking' ? SEEKING_LIST_POLICY_LABEL : label))
    .filter((label) => !(carpool && label === EXPLORE_RIDESHARE_AVAILABLE_BADGE));

  const placeLogisticsLabels = carpool ? [] : resolveActivityLinkedPlaceLogisticsLabels(card);

  return {
    title: meta.title,
    locationLine: meta.location,
    whenLine,
    price: meta.price,
    hostName: meta.hostName,
    hostAvatar: meta.hostAvatar,
    soldOut: meta.soldOut,
    factLabels: [...new Set(labels)].slice(0, TRIP_BROWSE_FACT_LIMIT),
    carpool,
    placeLogisticsLabels,
  };
};