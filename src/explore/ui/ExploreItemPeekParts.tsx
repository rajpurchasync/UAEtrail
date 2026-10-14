import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { ExploreActivityMapPeekActions } from './ExploreActivityMapPeekActions';
import { ExploreDemandOwnerPeekActions } from './ExploreDemandOwnerPeekActions';
import { resolveActivityPeekEngagement } from '../../activity/activityPeekEngagement';
import type { ExploreCardModel } from '../exploreCardModel';
import { JoinRequestActions } from '../../components/ui/JoinRequestActions';
import { ExploreShopPeekActions } from './ExploreShopPeekActions';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import {
  exploreCardActivityJoinIsFull,
  exploreCardHasMapCoords,
  exploreCardIsSeeking,
  exploreCardPeekShowsDirections,
  exploreCardShowsInlineDirections,
} from '../exploreCardModel';
import {
  ExploreCardDirectionsButton,
  ExploreCardPeopleRow,
  ExploreCardRequirementBadges,
  ExploreCardCapacityRow,
} from './ExploreCardPresentation';
import { resolveActivityMapPeekStrips } from '../../activity/activityPeekEngagement';
import { ExploreActivityPeekStrips } from './ExploreActivityPeekStrips';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';
import { ExploreAreaPeekActions } from './ExploreAreaPeekActions';
export interface ExploreItemPeekActionsProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onDemandRemove?: () => void;
  onDemandFullManage?: () => void;
  onDemandLinkRideshare?: () => void;
  /** Guests — detail, join-adjacent, and profile navigation show sign-up instead. */
  onGuestGatedAction?: () => void;
}

/** Map peek card CTAs — activity affordances from API or join flow fallback. */
export const ExploreItemPeekActions = ({
  card,
  onClose,
  onJoin,
  onMessage,
  onActivityMapPeekAction,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
  linkRideshareTenantId = null,
  onDemandRemove,
  onDemandFullManage,
  onDemandLinkRideshare,
  onGuestGatedAction,
}: ExploreItemPeekActionsProps) => {
  const isShop = card.source === 'shop';
  const isArea = card.source === 'area';
  const isDemand = exploreCardIsSeeking(card);
  const externalUrl = card.websiteUrl?.trim() || null;
  const gate = onGuestGatedAction;
  const activityPeekEngagement =
    card.source === 'activity' ? resolveActivityPeekEngagement(card, joinUiState) : null;
  const activityPeekActions = activityPeekEngagement?.mapPeekActions ?? [];
  const showActivityJoinFlow = activityPeekEngagement?.showsLegacyJoinFlow ?? false;
  const peekWithdraw =
    card.source === 'activity' ? undefined : onWithdraw;

  const detailLink = (label: string, className: string) => (
    <ExplorePeekDetailLink
      card={card}
      label={label}
      className={className}
      joinStateLoading={joinStateLoading}
      onGuestGatedAction={gate}
      onBeforeNavigate={onClose}
    />
  );

  if (isArea && card.areaSlug) {
    return (
      <ExploreAreaPeekActions
        areaSlug={card.areaSlug}
        stats={card.areaLensStats}
        areaPagePath={card.path}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      {card.showDemandOwnerActions && onDemandRemove ? (
        <ExploreDemandOwnerPeekActions
          onDelete={onDemandRemove}
          onFullManage={onDemandFullManage}
          showLinkRideshare={card.showDemandLinkRideshare}
          onLinkRideshare={onDemandLinkRideshare}
          onGuestGatedAction={gate}
        />
      ) : activityPeekActions.length > 0 && onActivityMapPeekAction ? (
        <ExploreActivityMapPeekActions
          card={card}
          actions={activityPeekActions}
          linkRideshareTenantId={linkRideshareTenantId}
          onAction={onActivityMapPeekAction}
          onGuestGatedAction={gate}
          joinStateLoading={joinStateLoading}
          onBeforeDetailNavigate={onClose}
        />
      ) : showActivityJoinFlow && joinUiState && !joinStateLoading ? (
        <>
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={card.primaryCta}
            isFull={exploreCardActivityJoinIsFull(card)}
            onJoin={gate ?? onJoin}
          />
          {card.secondaryCta ? (
            detailLink(
              card.secondaryCta,
              'block w-full py-2.5 text-center text-sm font-semibold text-gray-600'
            )
          ) : null}
        </>
      ) : showActivityJoinFlow && joinStateLoading ? (
        <div className="flex justify-center py-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : isDemand && joinUiState?.kind === 'confirmed' ? (
        <>
          <button
            type="button"
            disabled
            className="w-full rounded-2xl bg-emerald-100 py-3.5 text-base font-bold text-emerald-900 disabled:opacity-100"
          >
            You&apos;re in
          </button>
          {onMessage ? (
            <button
              type="button"
              onClick={gate ?? onMessage}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
            >
              {card.secondaryCta ?? 'Message'}
            </button>
          ) : null}
        </>
      ) : isDemand && onMessage && !card.showJoinActions ? (
        <button
          type="button"
          onClick={gate ?? onMessage}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white"
        >
          {card.primaryCta}
        </button>
      ) : card.showJoinActions && isDemand && joinUiState && !joinStateLoading ? (
        <>
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={card.primaryCta}
            isFull={exploreCardActivityJoinIsFull(card)}
            onJoin={gate ?? onJoin}
            onWithdraw={peekWithdraw}
          />
          {card.secondaryCta && onMessage ? (
            <button
              type="button"
              onClick={gate ?? onMessage}
              className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
            >
              {card.secondaryCta}
            </button>
          ) : null}
        </>
      ) : card.showJoinActions && isDemand && joinStateLoading ? (
        <div className="flex justify-center py-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : card.showJoinActions && onJoin ? (
        <>
          <button
            type="button"
            onClick={gate ?? onJoin}
            disabled={card.source === 'activity' && exploreCardActivityJoinIsFull(card)}
            className={`w-full rounded-2xl py-3.5 text-base font-bold ${
              card.source === 'activity' && exploreCardActivityJoinIsFull(card)
                ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
                : 'bg-emerald-500 text-white'
            }`}
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
        <ExploreShopPeekActions
          card={card}
          onClose={onClose}
          onGuestGatedAction={gate}
          externalUrl={externalUrl}
        />
      ) : card.showJoinActions ? (
        <>
          {gate &&
          exploreCardPeekShowsDirections(card) &&
          exploreCardHasMapCoords(card) &&
          !exploreCardShowsInlineDirections(card) ? (
            <ExploreCardDirectionsButton
              latitude={card.mapLatitude}
              longitude={card.mapLongitude}
            />
          ) : null}
            {detailLink(
              card.primaryCta,
              'block w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white'
            )}
        </>
      ) : (
        detailLink(
          card.secondaryCta ?? 'View details',
          'block w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900'
        )
      )}
    </>
  );
};

export const ExploreItemPeekBody = ({
  card,
  onGuestGatedAction,
  onOpenExploreItem,
  onOfferTransport,
  joinUiState,
}: {
  card: ExploreCardModel;
  onGuestGatedAction?: () => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinUiState?: JoinRequestUiState;
}) => {
  const isShop = card.source === 'shop';
  const showPeopleRow =
    card.source === 'activity' ||
    card.source === 'shop' ||
    (exploreCardIsSeeking(card) && Boolean(card.listHost || card.hostAvatar));

  if (card.source === 'area') {
    return card.subtitle ? (
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.subtitle}</p>
    ) : null;
  }

  if (card.source === 'activity') {
    const showJoinedChip = resolveActivityMapPeekStrips(card, joinUiState).showJoinedStatusChipOnPeek;
    return (
      <>
        {showJoinedChip ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
              Joined
            </span>
          </div>
        ) : null}
        <ExploreActivityPeekStrips
          card={card}
          joinUiState={joinUiState}
          onGuestGatedAction={onGuestGatedAction}
          onOpenExploreItem={onOpenExploreItem}
          onOfferTransport={onOfferTransport}
        />
      </>
    );
  }

  return (
    <>
      {isShop && card.sections.aboutLine && (
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.sections.aboutLine}</p>
      )}
      <ExploreCardCapacityRow card={card} />
      {card.requirementBadges && card.requirementBadges.length > 0 && (
        <ExploreCardRequirementBadges badges={card.requirementBadges} />
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
