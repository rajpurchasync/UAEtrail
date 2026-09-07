import { Link } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { exploreCardToneClass } from '../../explore/exploreCardModel';
import { OFFLINE_PAYMENT_NOTE } from '../../explore/explorePriceLabel';

interface ExploreItemSheetProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
}

export const ExploreItemSheet = ({ card, onClose, onJoin }: ExploreItemSheetProps) => (
  <div className="absolute inset-x-0 bottom-0 z-[1200] rounded-t-3xl bg-white px-5 pb-safe pt-4 shadow-[0_-12px_40px_rgba(15,23,42,.16)]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-emoji text-xl ${exploreCardToneClass[card.tone]}`}
      >
        {card.emoji}
      </span>
      {card.price && (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            card.price.kind === 'free'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {card.price.badge}
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    <h2 className="text-xl font-bold leading-snug text-gray-900">{card.headline}</h2>
    {card.subtitle && <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>}

    {card.spotsLabel && (
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
        <Lock className="h-3.5 w-3.5" />
        {card.spotsLabel}
      </div>
    )}

    {card.showJoinHint && (
      <p className="mt-2 text-xs text-gray-400">Request to join to see attendees.</p>
    )}

    {card.price?.showOfflineNote && (
      <p className="mt-2 text-xs text-gray-500">{OFFLINE_PAYMENT_NOTE}</p>
    )}

    {card.venueHint && <p className="mt-2 text-xs font-medium text-slate-500">{card.venueHint}</p>}

    <div className="mt-4 flex gap-2 pb-4">
      {card.showJoinActions && onJoin ? (
        <>
          <button
            type="button"
            onClick={onJoin}
            className="flex-1 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white"
          >
            {card.primaryCta}
          </button>
          <Link
            to={card.path}
            className="flex-1 rounded-2xl bg-neutral-100 py-3.5 text-center text-sm font-bold text-gray-900"
          >
            {card.secondaryCta}
          </Link>
        </>
      ) : (
        <Link
          to={card.path}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 text-center text-sm font-bold text-white"
        >
          {card.primaryCta}
        </Link>
      )}
    </div>
  </div>
);
