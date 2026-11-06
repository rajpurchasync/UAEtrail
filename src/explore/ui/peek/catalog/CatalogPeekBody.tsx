import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../../../../discovery/discoveryCardModel';
import {
  DiscoveryCardCapacityRow,
  DiscoveryCardPeopleRow,
  DiscoveryCardRequirementBadges,
} from '../../DiscoveryCardPresentation';

export type CatalogPeekBodyProps = {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
};

/** Shop / agency / mixed catalog rows on the activity pin host (non-venue wire). */
export const CatalogPeekBody = ({
  card,
  onGuestGatedAction,
  mapPeekCompact = false,
}: CatalogPeekBodyProps & { mapPeekCompact?: boolean }) => {
  const isShop = card.source === 'shop';
  const showPeopleRow =
    card.source === 'shop' ||
    (discoveryCardIsSeeking(card) && Boolean(card.listHost || card.hostAvatar));

  return (
    <>
      {isShop && card.sections.aboutLine && (
        <p
          className={`text-sm leading-relaxed text-gray-600 ${mapPeekCompact ? '' : 'mt-3'}`}
        >
          {card.sections.aboutLine}
        </p>
      )}
      <DiscoveryCardCapacityRow card={card} />
      {card.requirementBadges && card.requirementBadges.length > 0 ? (
        <div className={mapPeekCompact ? '' : 'mt-3'}>
          <DiscoveryCardRequirementBadges badges={card.requirementBadges} compact={mapPeekCompact} />
        </div>
      ) : null}
      {!mapPeekCompact && card.price && (
        <p className="mt-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              card.price.kind === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {card.price.badge}
          </span>
        </p>
      )}
      {showPeopleRow && !mapPeekCompact ? (
        <DiscoveryCardPeopleRow card={card} onGuestGatedAction={onGuestGatedAction} />
      ) : null}
      {card.venueHint && isShop && !mapPeekCompact ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{card.venueHint}</p>
      ) : null}
      {card.contactPhone && isShop && (
        <p className="mt-3 text-sm text-gray-600">
          Phone:{' '}
          <a href={`tel:${card.contactPhone}`} className="font-semibold text-emerald-700">
            {card.contactPhone}
          </a>
        </p>
      )}
    </>
  );
};
