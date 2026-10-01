import { ExternalLink } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { ExploreHostPeekActions } from './ExploreHostPeekActions';
import { ExploreDemandOwnerPeekActions } from './ExploreDemandOwnerPeekActions';
import { ExploreParticipantPeekActions } from './ExploreParticipantPeekActions';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { JoinRequestActions } from '../../components/ui/JoinRequestActions';
import { PlaceCardActions } from '../../components/ui/PlaceCardActions';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreLinkedRidesharePeekIndication } from './ExploreLinkedRidesharePeekIndication';
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
  onManage?: () => void;
  onHostFullManage?: () => void;
  onInviteCrew?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onHostRemove?: () => void;
  onDemandRemove?: () => void;
  onDemandFullManage?: () => void;
  onDemandLinkRideshare?: () => void;
  /** Guests — detail, join-adjacent, and profile navigation show sign-up instead. */
  onGuestGatedAction?: () => void;
}

/** Map peek card footer — join, host, shop, and demand actions. */
export const ExploreItemPeekFooter = ({
  card,
  onClose,
  onJoin,
  onMessage,
  onManage,
  onHostFullManage,
  onInviteCrew,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
  linkRideshareTenantId = null,
  onCreateLinkedRideshare,
  onHostRemove,
  onDemandRemove,
  onDemandFullManage,
  onDemandLinkRideshare,
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
      {card.showDemandOwnerActions && onDemandRemove ? (
        <ExploreDemandOwnerPeekActions
          onDelete={onDemandRemove}
          onFullManage={onDemandFullManage}
          showLinkRideshare={card.showDemandLinkRideshare}
          onLinkRideshare={onDemandLinkRideshare}
          onGuestGatedAction={gate}
        />
      ) : card.showHostActions ? (
        <ExploreHostPeekActions
          card={card}
          linkRideshareTenantId={linkRideshareTenantId}
          onCreateLinkedRideshare={onCreateLinkedRideshare}
          onMessage={onMessage}
          onHostRemove={onHostRemove}
          onFullManage={onHostFullManage}
          onManage={onManage}
          onInviteCrew={onInviteCrew}
          onGuestGatedAction={gate}
        />
      ) : joinUiState?.kind === 'confirmed' && card.activityId && onInviteCrew ? (
        <ExploreParticipantPeekActions
          activityId={card.activityId}
          onInviteCrew={onInviteCrew}
          onGuestGatedAction={gate}
        />
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
      ) : card.showJoinActions && joinUiState && !joinStateLoading ? (
        <>
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={card.primaryCta}
            isFull={(card.activity?.slotsAvailable ?? 1) <= 0}
            onJoin={gate ?? onJoin}
            onWithdraw={card.source === 'activity' ? onWithdraw : undefined}
          />
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
      ) : card.showJoinActions ? (
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
      ) : (
        detailLink(
          card.path,
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
}: {
  card: ExploreCardModel;
  onGuestGatedAction?: () => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
}) => {
  const isShop = card.source === 'shop';
  const showPeopleRow =
    card.source === 'activity' ||
    card.source === 'shop' ||
    (card.source === 'demand' && Boolean(card.listHost || card.hostAvatar));

  return (
    <>
      <ExploreLinkedRidesharePeekIndication card={card} onOpenExploreItem={onOpenExploreItem} />
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
