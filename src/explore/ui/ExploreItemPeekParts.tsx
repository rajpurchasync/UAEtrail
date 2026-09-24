import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { JoinRequestActions } from '../../components/ui/JoinRequestActions';
import { PlaceCardActions } from '../../components/ui/PlaceCardActions';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ORGANIZE_DEMAND_PREFILL_TITLE } from '../createFlowCopy';
import {
  ExploreCardCapacityRow,
  ExploreCardPeopleRow,
  ExploreCardRequirementBadges,
} from './ExploreCardPresentation';

export interface ExploreItemPeekFooterProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onFulfillIntent?: () => void;
  onManage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
}

/** Map peek card footer — join, host, shop, and demand actions. */
export const ExploreItemPeekFooter = ({
  card,
  onClose,
  onJoin,
  onMessage,
  onFulfillIntent,
  onManage,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
}: ExploreItemPeekFooterProps) => {
  const isShop = card.source === 'shop';
  const isDemand = card.source === 'demand';
  const externalUrl = card.websiteUrl?.trim() || null;

  return (
    <>
      {card.showHostActions && onMessage && onManage ? (
        <>
          <button
            type="button"
            onClick={onMessage}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
          >
            Message
          </button>
          <button
            type="button"
            onClick={onManage}
            className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
          >
            {card.activity?.status === 'published' ? 'Check in attendees' : 'Manage'}
          </button>
        </>
      ) : isDemand && onFulfillIntent ? (
        <>
          <button
            type="button"
            onClick={onFulfillIntent}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
          >
            {ORGANIZE_DEMAND_PREFILL_TITLE}
          </button>
          {onMessage ? (
            <button
              type="button"
              onClick={onMessage}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
            >
              Message
            </button>
          ) : null}
        </>
      ) : isDemand && onMessage ? (
        <button
          type="button"
          onClick={onMessage}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
        >
          {card.primaryCta}
        </button>
      ) : card.showJoinActions && joinUiState && !joinStateLoading ? (
        <JoinRequestActions
          uiState={joinUiState}
          joinLabel={card.primaryCta}
          isFull={(card.activity?.slotsAvailable ?? 1) <= 0}
          onJoin={onJoin}
          onWithdraw={onWithdraw}
        />
      ) : card.showJoinActions && joinStateLoading ? (
        <div className="flex justify-center py-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : card.showJoinActions && onJoin ? (
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
      ) : isShop ? (
        card.reviewPath ? (
          <PlaceCardActions detailPath={card.path} reviewPath={card.reviewPath} accent="emerald" embedded />
        ) : (
          <>
            <Link
              to={card.path}
              className="block w-full rounded-2xl bg-emerald-500 py-3.5 text-center text-base font-bold text-white"
            >
              {card.primaryCta}
            </Link>
            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 py-2.5 text-center text-sm font-semibold text-emerald-700"
              >
                {card.secondaryCta ?? 'Visit website'}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
              >
                Close
              </button>
            )}
          </>
        )
      ) : (
        <Link
          to={card.path}
          className="block w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
        >
          {card.primaryCta}
        </Link>
      )}
    </>
  );
};

export const ExploreItemPeekBody = ({ card }: { card: ExploreCardModel }) => {
  const isShop = card.source === 'shop';
  const showPeopleRow =
    card.source === 'activity' ||
    card.source === 'shop' ||
    (card.source === 'demand' && Boolean(card.listHost || card.hostAvatar));

  return (
    <>
      {isShop && card.sections.aboutLine && (
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.sections.aboutLine}</p>
      )}
      <ExploreCardCapacityRow card={card} />
      {card.requirementBadges && card.requirementBadges.length > 0 && (
        <ExploreCardRequirementBadges badges={card.requirementBadges} />
      )}
      {card.price && card.source === 'activity' && (
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
      {showPeopleRow && <ExploreCardPeopleRow card={card} />}
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
