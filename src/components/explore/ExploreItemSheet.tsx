import { ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { OFFLINE_PAYMENT_NOTE } from '../../explore/explorePriceLabel';
import { ShareButton } from '../ui/ShareButton';
import {
  ExploreCardCapacityRow,
  ExploreCardDetailList,
  ExploreCardHeadline,
  ExploreCardPeopleRow,
  ExploreCardTypeBadge,
} from './ExploreCardPresentation';

interface ExploreItemSheetProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
}

export const ExploreItemSheet = ({ card, onClose, onJoin, onMessage }: ExploreItemSheetProps) => {
  const isShop = card.source === 'shop';
  const isAgency = card.source === 'agency';
  const isDemand = card.source === 'demand';
  const externalUrl = card.websiteUrl?.trim() || null;
  const showPeopleRow =
    card.source === 'activity' || (card.source === 'demand' && Boolean(card.listHost || card.hostAvatar));

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1200] rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(15,23,42,.14)]">
      <div className="flex justify-center pt-3">
        <span className="h-1 w-10 rounded-full bg-neutral-200" aria-hidden />
      </div>

      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <ExploreCardTypeBadge card={card} />
        <div className="flex items-center gap-2">
          <ShareButton
            title={card.shareTitle}
            text={card.shareText ?? undefined}
            path={card.sharePath}
            iconOnly
            light
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-4">
        <ExploreCardHeadline sections={card.sections} />
        {isShop && card.sections.aboutLine && (
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.sections.aboutLine}</p>
        )}
        <ExploreCardCapacityRow card={card} />
        <ExploreCardDetailList details={card.sections.details} />

        {card.price && card.source === 'activity' && (
          <p className="mt-4">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                card.price.kind === 'free'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {card.price.badge}
            </span>
          </p>
        )}

        {showPeopleRow && <ExploreCardPeopleRow card={card} />}

        {card.price?.showOfflineNote && (
          <p className="mt-4 text-xs leading-relaxed text-gray-500">{OFFLINE_PAYMENT_NOTE}</p>
        )}

        {card.venueHint && isAgency && (
          <p className="mt-4 text-xs leading-relaxed text-slate-500">{card.venueHint}</p>
        )}

        {card.contactPhone && (isShop || isAgency) && (
          <p className="mt-4 text-sm text-gray-600">
            Phone:{' '}
            <a href={`tel:${card.contactPhone}`} className="font-semibold text-emerald-700">
              {card.contactPhone}
            </a>
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2 border-t border-neutral-100 px-5 py-4 pb-safe">
        {card.showJoinActions && onJoin ? (
          <>
            <button
              type="button"
              onClick={onJoin}
              className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
            >
              {card.primaryCta}
            </button>
            {card.secondaryCta && isDemand && onMessage ? (
              <button
                type="button"
                onClick={onMessage}
                className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
              >
                {card.secondaryCta}
              </button>
            ) : card.secondaryCta && card.source === 'activity' ? (
              <Link
                to={card.path}
                className="block w-full py-2.5 text-center text-sm font-semibold text-gray-600"
              >
                {card.secondaryCta}
              </Link>
            ) : null}
          </>
        ) : isDemand ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900"
          >
            Close
          </button>
        ) : isShop && externalUrl ? (
          <>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
            >
              {card.primaryCta}
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
            >
              Close
            </button>
          </>
        ) : (
          <Link
            to={card.path}
            className="block w-full rounded-2xl bg-emerald-500 py-3.5 text-center text-base font-bold text-white"
          >
            {card.primaryCta}
          </Link>
        )}
      </div>
    </div>
  );
};
