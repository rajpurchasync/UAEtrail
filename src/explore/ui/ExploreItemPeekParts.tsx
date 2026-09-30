import { ExternalLink } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { ExploreHostPeekActions } from './ExploreHostPeekActions';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { JoinRequestActions } from '../../components/ui/JoinRequestActions';
import { PlaceCardActions } from '../../components/ui/PlaceCardActions';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import {
  EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX,
  EXPLORE_LINKED_RIDESHARES_PEEK_TITLE,
  ORGANIZE_DEMAND_PREFILL_TITLE,
} from '../createFlowCopy';
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
  linkCarpoolTenantId?: string | null;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onHostRemove?: () => void;
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
  linkCarpoolTenantId = null,
  onCreateLinkedRideshare,
  onHostRemove,
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
      {card.showHostActions && onMessage && onHostRemove ? (
        <ExploreHostPeekActions
          card={card}
          linkCarpoolTenantId={linkCarpoolTenantId}
          onCreateLinkedRideshare={onCreateLinkedRideshare}
          onMessage={onMessage}
          onHostRemove={onHostRemove}
          onManage={onManage}
          onGuestGatedAction={gate}
        />
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
      {card.kind === 'carpool' && card.activity?.linkedParentActivity ? (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => onOpenExploreItem?.(`activity:${card.activity!.linkedParentActivity!.id}`)}
            className="text-sm font-semibold text-sky-800 underline underline-offset-2"
          >
            {EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX} {card.activity.linkedParentActivity.title}
          </button>
        </div>
      ) : null}
      {card.linkedRideshares && card.linkedRideshares.length > 0 ? (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {EXPLORE_LINKED_RIDESHARES_PEEK_TITLE}
          </p>
          <ul className="mt-2 space-y-2">
            {card.linkedRideshares.map((ride) => (
              <li key={ride.exploreItemId}>
                <button
                  type="button"
                  onClick={() => onOpenExploreItem?.(ride.exploreItemId)}
                  className="w-full text-left text-sm font-semibold text-sky-800 underline underline-offset-2"
                >
                  {ride.title}
                </button>
                {ride.subtitle ? (
                  <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{ride.subtitle}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
