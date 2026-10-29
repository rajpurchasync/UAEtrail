import { isGeographyMapSource, resolveActivityPublisherChip } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

const SOLD_OUT = /sold\s*out/i;
const AED_IN_BADGE = /AED\s*[\d.]+(?:\/seat)?/i;

export type ListExplorerCardMeta = {
  title: string;
  hostName: string | null;
  hostAvatar: string | null;
  price: string | null;
  location: string | null;
  when: string | null;
  soldOut: boolean;
  dateIso: string | null;
};

/** Host-provided outing/place name — not the social “X is going Hiking on Saturday” headline. */
export const listExplorerCardTitle = (card: DiscoveryCardModel): string => {
  const activityTitle = card.activity?.title?.trim();
  if (activityTitle) return activityTitle;
  if (isGeographyMapSource(card.source) || card.source === 'shop' || card.source === 'agency') {
    const headline = card.headline?.trim();
    if (headline) return headline.split(' - ')[0]?.trim() || headline;
    return card.listTitle.trim();
  }
  return card.routeLabel?.trim() || card.sections.activityHighlight?.trim() || card.listTitle.trim();
};

export const listExplorerHostName = (card: DiscoveryCardModel): string | null =>
  card.listHost?.trim() ||
  card.featuredPerson?.displayName?.trim() ||
  card.sections.hostName?.trim() ||
  null;

export const listExplorerPriceLabel = (card: DiscoveryCardModel): string | null => {
  const price = card.price;
  if (!price) return null;
  if (price.kind === 'free') return 'Free';
  const aed = price.badge.match(AED_IN_BADGE);
  if (aed) return aed[0].replace(/\s+/g, ' ');
  return price.badge;
};

export const listExplorerCardMeta = (card: DiscoveryCardModel): ListExplorerCardMeta => {
  const dateIso = card.activity?.date?.trim() || null;
  const soldOut =
    card.activity?.slotsAvailable === 0 || SOLD_OUT.test(card.spotsLabel ?? '');
  const location = card.venueHint?.trim() || card.subtitle?.trim() || null;
  const isEvent = card.source === 'activity';
  const publisher = isEvent
    ? resolveActivityPublisherChip({
        publishingProfileKind: card.activity?.publishingProfileKind,
        tenantName: card.activity?.tenantName,
        tenantLogoUrl: card.activity?.tenantLogoUrl,
        hostName: listExplorerHostName(card),
        hostAvatar: card.hostAvatar?.trim() || card.featuredPerson?.avatarUrl?.trim() || null,
        listHost: card.listHost,
      })
    : null;
  return {
    title: listExplorerCardTitle(card),
    hostName: publisher?.name ?? null,
    hostAvatar: publisher?.avatarUrl ?? null,
    price: isEvent ? listExplorerPriceLabel(card) : null,
    location,
    when: card.whenLabel?.trim() || null,
    soldOut,
    dateIso,
  };
};

export const listExplorerCardDateIso = (card: DiscoveryCardModel): string | null =>
  listExplorerCardMeta(card).dateIso;
