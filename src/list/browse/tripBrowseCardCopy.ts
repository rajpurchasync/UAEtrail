import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EXPLORE_RIDESHARE_AVAILABLE_BADGE } from './discoveryListRuntime';
import { browseCardMeta, browseRowWhenDisplay } from './browseCardMeta';
import { LIST_FEED_CTA_CARPOOL } from './listFeedCtaCopy';
import { resolveListFeedPosterRequirementLabels } from './listFeedPosterStandard';
import { resolveActivityLinkedPlaceLogisticsLabels } from './venueBrowseFacts';
import { resolveDiscoveryBrowseLocationHref } from '../../discovery/browse/resolveDiscoveryBrowseGeoLink';

const TRIP_BROWSE_FACT_LIMIT = 5;
export const TRIP_BROWSE_VISIBLE_FACT_LIMIT = 3;
const SEEKING_LIST_POLICY_LABEL = 'Looking for';

const joinMetaParts = (parts: (string | null | undefined)[]): string | null => {
  const next = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  return next.length > 0 ? next.join(' · ') : null;
};

export type TripBrowseCardCarpool = {
  label: string;
  path: string;
  exploreItemId: string | null;
};

export type TripBrowseCardCopy = {
  title: string;
  metaLine: string | null;
  metaHref: string | null;
  locationLine: string | null;
  whenLine: string | null;
  price: string | null;
  hostName: string | null;
  hostAvatar: string | null;
  soldOut: boolean;
  factLabels: string[];
  visibleFactLabels: string[];
  carpool: TripBrowseCardCarpool | null;
  placeLogisticsLabels: string[];
};

/** Trips browse bucket — meta under title; host + labels in the body. */
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

  const factLabels = [...new Set(labels)].slice(0, TRIP_BROWSE_FACT_LIMIT);

  return {
    title: meta.title,
    metaLine: joinMetaParts([whenLine, meta.location]),
    metaHref: meta.location
      ? resolveDiscoveryBrowseLocationHref(card, 'list')
      : null,
    locationLine: meta.location,
    whenLine,
    price: meta.price,
    hostName: meta.hostName,
    hostAvatar: meta.hostAvatar,
    soldOut: meta.soldOut,
    factLabels,
    visibleFactLabels: factLabels.slice(0, TRIP_BROWSE_VISIBLE_FACT_LIMIT),
    carpool,
    placeLogisticsLabels,
  };
};