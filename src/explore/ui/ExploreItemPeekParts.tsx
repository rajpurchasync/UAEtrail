import { Car, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { JoinRequestActions } from '../../components/ui/JoinRequestActions';
import { PlaceCardActions } from '../../components/ui/PlaceCardActions';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ORGANIZE_DEMAND_PREFILL_TITLE, ORGANIZE_LINK_CARPOOL_HINT, ORGANIZE_LINK_CARPOOL_LABEL } from '../createFlowCopy';
import {
  exploreCardHasMapCoords,
  exploreCardShowsInlineDirections,
} from '../exploreCardModel';
import {
  ExploreCardCapacityRow,
  ExploreCardDirectionsButton,
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
  showCarpoolLink?: boolean;
  onLinkCarpool?: () => void;
  carpoolLinkLoading?: boolean;
  /** Guests — detail, join-adjacent, and profile navigation show sign-up instead. */
  onGuestGatedAction?: () => void;
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
  showCarpoolLink = false,
  onLinkCarpool,
  carpoolLinkLoading = false,
  onGuestGatedAction,
}: ExploreItemPeekFooterProps) => {
  const isShop = card.source === 'shop';
  const isDemand = card.source === 'demand';
  const externalUrl = card.websiteUrl?.trim() || null;
  const gate = onGuestGatedAction;

  const detailLink = (to: string, label: string, className: string) =>
    gate ? (
      <button type="button" onClick={gate} className={className}>
        {label}
      </button>
    ) : (
      <Link to={to} className={className}>
        {label}
      </Link>
    );

  return (
    <>
      {card.showHostActions && onMessage && onManage ? (
        <>
          {showCarpoolLink && onLinkCarpool ? (
            <div className="mb-3 rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-3">
              <p className="text-sm font-semibold text-gray-900">{ORGANIZE_LINK_CARPOOL_LABEL}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{ORGANIZE_LINK_CARPOOL_HINT}</p>
              <button
                type="button"
                disabled={carpoolLinkLoading}
                onClick={gate ?? onLinkCarpool}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                <Car className="h-4 w-4" aria-hidden />
                {carpoolLinkLoading ? 'Linking…' : ORGANIZE_LINK_CARPOOL_LABEL}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={gate ?? onMessage}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
          >
            Message
          </button>
          <button
            type="button"
            onClick={gate ?? onManage}
            className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
          >
            {card.activity?.status === 'published' ? 'Check in attendees' : 'Manage'}
          </button>
        </>
      ) : isDemand && onFulfillIntent ? (
        <>
          <button
            type="button"
            onClick={gate ?? onFulfillIntent}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
          >
            {ORGANIZE_DEMAND_PREFILL_TITLE}
          </button>
          {onMessage ? (
            <button
              type="button"
              onClick={gate ?? onMessage}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
            >
              Message
            </button>
          ) : null}
        </>
      ) : isDemand && onMessage ? (
        <button
          type="button"
          onClick={gate ?? onMessage}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
        >
          {card.primaryCta}
        </button>
      ) : card.showJoinActions && joinUiState && !joinStateLoading ? (
        <>
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={card.primaryCta}
            isFull={(card.activity?.slotsAvailable ?? 1) <= 0}
            onJoin={gate ?? onJoin}
            onWithdraw={onWithdraw}
          />
          {card.secondaryCta && card.source === 'activity' ? (
            detailLink(
              card.path,
              card.secondaryCta,
              'block w-full py-2.5 text-center text-sm font-semibold text-gray-600'
            )
          ) : null}
        </>
      ) : card.showJoinActions && joinStateLoading ? (
        <div className="flex justify-center py-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : card.showJoinActions && onJoin ? (
        <>
          <button
            type="button"
            onClick={gate ?? onJoin}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
          >
            {card.primaryCta}
          </button>
          {card.secondaryCta && isDemand && onMessage ? (
            <button
              type="button"
              onClick={gate ?? onMessage}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
            >
              {card.secondaryCta}
            </button>
          ) : card.secondaryCta && card.source === 'activity' ? (
            detailLink(
              card.path,
              card.secondaryCta,
              'block w-full py-2.5 text-center text-sm font-semibold text-gray-600'
            )
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
          <PlaceCardActions
            detailPath={card.path}
            reviewPath={card.reviewPath}
            accent="emerald"
            embedded
            onGuestGatedAction={gate}
            mapLatitude={card.mapLatitude}
            mapLongitude={card.mapLongitude}
            showGuestDirections={!exploreCardShowsInlineDirections(card)}
          />
        ) : (
          <>
            {detailLink(
              card.path,
              card.primaryCta,
              'block w-full rounded-2xl bg-emerald-500 py-3.5 text-center text-base font-bold text-white'
            )}
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
        <>
          {gate &&
          exploreCardHasMapCoords(card) &&
          !exploreCardShowsInlineDirections(card) ? (
            <ExploreCardDirectionsButton
              latitude={card.mapLatitude}
              longitude={card.mapLongitude}
            />
          ) : null}
          {detailLink(
            card.path,
            card.primaryCta,
            'block w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white'
          )}
        </>
      )}
    </>
  );
};

export const ExploreItemPeekBody = ({
  card,
  onGuestGatedAction,
}: {
  card: ExploreCardModel;
  onGuestGatedAction?: () => void;
}) => {
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
      {card.source !== 'activity' && card.requirementBadges && card.requirementBadges.length > 0 && (
        <ExploreCardRequirementBadges badges={card.requirementBadges} />
      )}
      {card.price && card.source !== 'activity' && (
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
      {showPeopleRow && <ExploreCardPeopleRow card={card} onGuestGatedAction={onGuestGatedAction} />}
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
