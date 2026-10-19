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
export const CatalogPeekBody = ({ card, onGuestGatedAction }: CatalogPeekBodyProps) => {
  const isShop = card.source === 'shop';
  const showPeopleRow =
    card.source === 'shop' ||
    (discoveryCardIsSeeking(card) && Boolean(card.listHost || card.hostAvatar));

  return (
    <>
      {isShop && card.sections.aboutLine && (
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.sections.aboutLine}</p>
      )}
      <DiscoveryCardCapacityRow card={card} />
      {card.requirementBadges && card.requirementBadges.length > 0 && (
        <DiscoveryCardRequirementBadges badges={card.requirementBadges} />
      )}
      {card.price && (
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
      {showPeopleRow && <DiscoveryCardPeopleRow card={card} onGuestGatedAction={onGuestGatedAction} />}
      {card.venueHint && isShop && (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{card.venueHint}</p>
      )}
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
