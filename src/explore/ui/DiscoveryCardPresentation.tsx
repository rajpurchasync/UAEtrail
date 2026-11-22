import type { ReactNode } from 'react';
import {
  activityGuideCountLabel,
  isGeographyMapSource,
  resolveActivityPublisherChip,
} from '@uaetrail/shared-types';
import { ChevronRight, Clock, MapPin, Route, Star, Tag, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DiscoveryCardModel, DiscoveryCardTone } from '../../discovery/discoveryCardModel';
import type { MapPeekDetailNavState } from '../mapPeekDetailNavState';
import {
  discoveryCardActivityJoinIsFull,
  discoveryCardActivityShowsPeekSpots,
  discoveryCardCanOpenHostProfile,
  discoveryCardIsAvailabilityPin,
  discoveryCardToneTextClass,
  resolveDiscoveryCardHostProfilePath,
} from '../../discovery/discoveryCardModel';
import {
  ACTIVITY_PEEK_FULL_CAPACITY_LABEL,
  ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE,
  ACTIVITY_PEEK_SECTION_SPOTS,
} from '../../content/activityPeekCopy';
import { HOSTED_BY_LABEL } from '../../content/workspaceVocabulary';
import { resolveDiscoveryHostTrustLabels } from '../../discovery/discoveryHostTrustPresentation';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import {
  buildActivitySpotsLeftLabel,
  type DiscoveryCardDetail,
  type DiscoveryCardDetailIcon,
  type DiscoveryCardSections,
} from '../exploreCopy';
import { DirectionsControl } from '../../components/ui/DirectionsControl';
import { capitalize } from '../../utils';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { ParticipantPreview } from '../../components/ui/ParticipantPreview';
import { DiscoveryCardTypeIcon } from './DiscoveryCardTypeIcon';
import type { ExplorePeekDetailAccess } from '../../access/mapViewerAccessToUi';
import { proMembershipPath } from '../../config/routingCatalog';
import {
  ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT,
  ACTIVITY_DETAIL_PRO_ROSTER_HINT,
  ACTIVITY_DETAIL_PRO_SOCIAL_CTA,
} from '../../content/activityDetailCopy';
import { resolveActivityMapPeekStrips } from '../../activity/activityPeekEngagement';

const detailIcon = (icon: DiscoveryCardDetailIcon) => {
  switch (icon) {
    case 'location':
      return MapPin;
    case 'time':
      return Clock;
    case 'spots':
      return Users;
    case 'route':
      return Route;
    case 'price':
      return Tag;
    default:
      return MapPin;
  }
};

const DiscoveryCardHeadlineShell = ({
  detailAccess,
  onGuestGatedDetail,
  onBeforeDetailNavigate,
  detailLinkState,
  textClass,
  children,
}: {
  detailAccess?: ExplorePeekDetailAccess | null;
  onGuestGatedDetail?: () => void;
  onBeforeDetailNavigate?: () => void;
  detailLinkState?: MapPeekDetailNavState;
  textClass: string;
  children: ReactNode;
}) => {
  const titleLinkClass = `${EXPLORE_TYPE.title} ${textClass} text-left hover:underline decoration-neutral-400/60 underline-offset-2`;
  const plainClass = `${EXPLORE_TYPE.title} ${textClass}`;

  if (detailAccess?.kind === 'link') {
    return (
      <Link
        to={detailAccess.href}
        state={detailLinkState}
        className={titleLinkClass}
        onClick={() => onBeforeDetailNavigate?.()}
      >
        {children}
      </Link>
    );
  }
  if (detailAccess?.kind === 'guest_gate' && onGuestGatedDetail) {
    return (
      <button type="button" onClick={onGuestGatedDetail} className={titleLinkClass}>
        {children}
      </button>
    );
  }
  if (detailAccess?.kind === 'profile_gate' || detailAccess?.kind === 'upgrade_gate') {
    return (
      <Link
        to={detailAccess.href}
        state={detailLinkState}
        className={titleLinkClass}
        onClick={() => onBeforeDetailNavigate?.()}
      >
        {children}
      </Link>
    );
  }
  return <p className={plainClass}>{children}</p>;
};

/** Primary title — one clear line, easy to scan. */
export const DiscoveryCardHeadline = ({
  sections,
  size = 'lg',
  lineClamp,
  tone = 'hiking',
  detailAccess,
  onGuestGatedDetail,
  onBeforeDetailNavigate,
  detailLinkState,
}: {
  sections: DiscoveryCardSections;
  size?: 'sm' | 'lg';
  /** Map pin summary — keep title on two lines max. */
  lineClamp?: 2;
  tone?: DiscoveryCardTone;
  detailAccess?: ExplorePeekDetailAccess | null;
  onGuestGatedDetail?: () => void;
  onBeforeDetailNavigate?: () => void;
  detailLinkState?: MapPeekDetailNavState;
}) => {
  const textClass =
    (size === 'lg'
      ? 'text-xl font-bold leading-snug'
      : 'text-[16px] font-bold leading-snug') + (lineClamp === 2 ? ' line-clamp-2' : '');
  const highlightClass = discoveryCardToneTextClass[tone];

  if (sections.plainTitle) {
    return (
      <DiscoveryCardHeadlineShell
        detailAccess={detailAccess}
        onGuestGatedDetail={onGuestGatedDetail}
        onBeforeDetailNavigate={onBeforeDetailNavigate}
        detailLinkState={detailLinkState}
        textClass={textClass}
      >
        {sections.plainTitle}
      </DiscoveryCardHeadlineShell>
    );
  }

  if (sections.titleText && sections.hostName) {
    return (
      <DiscoveryCardHeadlineShell
        detailAccess={detailAccess}
        onGuestGatedDetail={onGuestGatedDetail}
        onBeforeDetailNavigate={onBeforeDetailNavigate}
        detailLinkState={detailLinkState}
        textClass={textClass}
      >
        {sections.titleText}
        <span className={`font-normal ${EXPLORE_TYPE.caption}`}> · </span>
        <span className={`font-bold ${EXPLORE_TYPE.body}`}>{sections.hostName}</span>
      </DiscoveryCardHeadlineShell>
    );
  }

  if (sections.highlightName) {
    return (
      <DiscoveryCardHeadlineShell
        detailAccess={detailAccess}
        onGuestGatedDetail={onGuestGatedDetail}
        onBeforeDetailNavigate={onBeforeDetailNavigate}
        detailLinkState={detailLinkState}
        textClass={textClass}
      >
        <span>{sections.highlightName}</span>
        {sections.suffix && <span>{sections.suffix}</span>}
        {sections.activityHighlight && (
          <span className={highlightClass}>{sections.activityHighlight}</span>
        )}
        {sections.dateHighlight && <span>{sections.dateHighlight}</span>}
      </DiscoveryCardHeadlineShell>
    );
  }

  return null;
};

/** Venue / shop / agency aggregate rating from community reviews. */
export const DiscoveryCardRatingRow = ({
  card,
  compact = false,
}: {
  card: DiscoveryCardModel;
  compact?: boolean;
}) => {
  if (!isGeographyMapSource(card.source) && card.source !== 'shop' && card.source !== 'agency') return null;

  const spacing = compact ? 'mt-0' : 'mt-2';

  if (!card.reviewCount) {
    return (
      <p className={`${spacing} flex items-center gap-1.5 text-sm font-semibold ${EXPLORE_TYPE.muted}`}>
        <Star className="h-4 w-4 text-amber-300" aria-hidden />
        No reviews yet
      </p>
    );
  }

  return (
    <p className={`${spacing} flex items-center gap-1.5 text-sm font-bold ${EXPLORE_TYPE.body}`}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      {card.averageRating?.toFixed(1)} · {card.reviewCount} review{card.reviewCount === 1 ? '' : 's'}
    </p>
  );
};

/** Full-width directions CTA — never gated (guests can navigate to the pin). */
export const DiscoveryCardDirectionsButton = ({
  latitude,
  longitude,
  className = 'flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white',
  showAppPickerAffordance = true,
  showLeadingIcon = true,
}: {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
  showAppPickerAffordance?: boolean;
  showLeadingIcon?: boolean;
}) => {
  if (latitude == null || longitude == null) return null;
  return (
    <DirectionsControl
      lat={latitude}
      lng={longitude}
      variant="button"
      className="w-full"
      buttonClassName={className}
      showAppPickerAffordance={showAppPickerAffordance}
      showLeadingIcon={showLeadingIcon}
    />
  );
};

/** Location label — city/area plus Google Maps directions when pinned. */
export const DiscoveryCardLocationLink = ({
  label,
  latitude,
  longitude,
  className = '',
  iconClassName = 'h-4 w-4 shrink-0 text-gray-400',
  showDirections = true,
}: {
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
  iconClassName?: string;
  /** Activity peek — location label only (no Get Directions). */
  showDirections?: boolean;
}) => {
  const hasCoords = showDirections && latitude != null && longitude != null;
  const linkClass =
    'inline-flex items-center gap-1 font-medium text-emerald-700 underline decoration-emerald-700/30 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-800';

  const directionsAction = hasCoords ? (
    <DirectionsControl
      lat={latitude}
      lng={longitude}
      variant="link"
      label="Get Directions"
      linkClassName={linkClass}
    />
  ) : null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <MapPin className={iconClassName} aria-hidden />
        <span className={`font-semibold ${EXPLORE_TYPE.body}`}>{label}</span>
      </span>
      {directionsAction ? (
        <>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          {directionsAction}
        </>
      ) : null}
    </span>
  );
};

/** Secondary facts — muted, spaced, never crammed into the title. */
export const DiscoveryCardDetailList = ({
  details,
  compact = false,
  mapPeekCompact = false,
  mapLatitude,
  mapLongitude,
  showDirections = true,
}: {
  details: DiscoveryCardDetail[];
  compact?: boolean;
  mapPeekCompact?: boolean;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  showDirections?: boolean;
}) => {
  if (details.length === 0) return null;

  if (compact) {
    const locationDetail = details.find((detail) => detail.icon === 'location');
    const detailClass = mapPeekCompact
      ? `mt-1 text-xs leading-snug line-clamp-2 ${EXPLORE_TYPE.body}`
      : `mt-2 text-sm ${EXPLORE_TYPE.body}`;
    if (locationDetail) {
      return (
        <DiscoveryCardLocationLink
          label={locationDetail.label}
          latitude={mapLatitude}
          longitude={mapLongitude}
          showDirections={showDirections}
          className={detailClass}
        />
      );
    }

    return (
      <p className={`${detailClass}${mapPeekCompact ? '' : ' font-semibold leading-relaxed'}`}>
        {details.map((detail) => detail.label).join(' · ')}
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2.5">
      {details.map((detail) => {
        const Icon = detailIcon(detail.icon);
        const isLocation = detail.icon === 'location';
        return (
          <li
            key={`${detail.icon}-${detail.label}`}
            className={`flex items-start gap-2.5 text-sm font-medium leading-snug ${EXPLORE_TYPE.body}`}
          >
            {isLocation ? (
              <DiscoveryCardLocationLink
                label={detail.label}
                latitude={mapLatitude}
                longitude={mapLongitude}
                showDirections={showDirections}
                className="items-start"
                iconClassName="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
              />
            ) : (
              <>
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                <span>{detail.label}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const DiscoveryCardRequirementBadges = ({
  badges,
  compact = false,
}: {
  badges: string[];
  compact?: boolean;
}) => {
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-1.5'}`}>
      {badges.map((badge) => (
        <span
          key={badge}
          className={`inline-flex rounded-full bg-neutral-100 font-bold ${EXPLORE_TYPE.body} ${
            compact ? 'px-2 py-0.5 text-[10px] leading-tight' : 'px-2.5 py-1 text-[11px]'
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
};

/** Restriction chips + price on map peek — join mode is conveyed by the primary CTA only. */
export const ExploreActivityPeekMeta = ({
  card,
  compact = false,
}: {
  card: DiscoveryCardModel;
  compact?: boolean;
}) => {
  if (card.source !== 'activity') return null;

  const hasBadges = (card.requirementBadges?.length ?? 0) > 0;
  const hasPrice = Boolean(card.price);
  if (!hasBadges && !hasPrice) return null;

  const badgeClass = compact
    ? 'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight'
    : 'inline-flex rounded-full px-3 py-1 text-xs font-semibold';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-0' : 'mt-3 gap-2'}`}>
      {hasBadges ? (
        <DiscoveryCardRequirementBadges badges={card.requirementBadges!} compact={compact} />
      ) : null}
      {card.price ? (
        <span
          className={`${badgeClass} ${
            card.price.kind === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {card.price.badge}
        </span>
      ) : null}
    </div>
  );
};

export const DiscoveryCardPeopleRow = ({
  card,
  onGuestGatedAction,
  hideProMembershipUpsell = false,
  compactSection = false,
  mapPeekCompact = false,
}: {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  /** Map peek — hide Pro membership hints (detail page keeps upsell). */
  hideProMembershipUpsell?: boolean;
  /** Nested in peek strip — drop outer divider spacing. */
  compactSection?: boolean;
  mapPeekCompact?: boolean;
}) => {
  const participants = card.participantPreviews ?? [];
  const entitlements = card.viewerAccess?.entitlements;
  const isHostViewer = card.viewerAccess?.level === 'host';
  const visibleParticipants =
    card.source !== 'activity' || !entitlements || entitlements.canViewFullBuddyRoster || isHostViewer
      ? participants
      : participants.filter((row) => entitlements.buddyUserIdsOnActivity.includes(row.id));
  const showRosterProUpsell =
    !hideProMembershipUpsell &&
    card.source === 'activity' &&
    Boolean(entitlements) &&
    !entitlements!.canViewFullBuddyRoster &&
    !isHostViewer &&
    participants.length > visibleParticipants.length;
  const person = card.featuredPerson;
  const publisher = resolveActivityPublisherChip({
    publishingProfileKind: card.activity?.publishingProfileKind,
    tenantName: card.activity?.tenantName,
    tenantLogoUrl: card.activity?.tenantLogoUrl,
    hostName: card.listHost ?? person?.displayName ?? card.sections.hostName ?? card.sections.highlightName,
    hostAvatar: card.hostAvatar,
    listHost: card.listHost,
  });
  const hostName = publisher.name;
  const hostAvatar = publisher.avatarUrl ?? card.hostAvatar;
  const acceptedGuideCount = card.activity?.acceptedGuideCount ?? card.activity?.guides?.length ?? 0;
  const hostProfilePath = resolveDiscoveryCardHostProfilePath(card);
  const isGuestViewer = Boolean(onGuestGatedAction);
  const canOpenHostProfile = discoveryCardCanOpenHostProfile(card, { isGuest: isGuestViewer });
  const hostPath =
    hostProfilePath && canOpenHostProfile && !isGuestViewer ? hostProfilePath : null;
  const showHostProfileProUpsell =
    !hideProMembershipUpsell &&
    card.source === 'activity' &&
    Boolean(hostProfilePath) &&
    card.viewerAccess?.entitlements != null &&
    !card.viewerAccess.entitlements.canViewHostProfileBeforeJoin;
  const showMyHostProfileSubtitle =
    card.source === 'activity' && resolveActivityMapPeekStrips(card).showHostSelfProfileLink;
  const hostProfileSubtitle = (base: string) =>
    showMyHostProfileSubtitle ? ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE : base;
  const peekGuideCountLine =
    card.source === 'activity' && acceptedGuideCount > 1
      ? activityGuideCountLabel(acceptedGuideCount)
      : null;
  const hostedByLabel =
    card.source === 'shop' ? 'Shop contact' : publisher.kind === 'company' ? 'Tour operator' : HOSTED_BY_LABEL;
  const hostTrustLine = resolveDiscoveryHostTrustLabels(card).join(' · ');

  const showHostRow =
    Boolean(hostName || card.hostAvatar) &&
    (card.source === 'activity' ||
      card.source === 'shop' ||
      (discoveryCardIsAvailabilityPin(card) && participants.length === 0));

  if (!showHostRow && participants.length === 0) return null;

  const avatarClass = mapPeekCompact
    ? 'h-8 w-8 text-xs ring-2 ring-white shrink-0'
    : 'h-10 w-10 text-sm ring-2 ring-white shrink-0';
  const avatarClassPlain = mapPeekCompact
    ? 'h-8 w-8 text-xs ring-2 ring-white'
    : 'h-10 w-10 text-sm ring-2 ring-white';
  const nameClass = mapPeekCompact
    ? 'text-xs font-semibold text-gray-900 truncate'
    : 'text-sm font-semibold text-gray-900 truncate';
  const linkNameClass = `${nameClass}${mapPeekCompact ? '' : ' group-hover:text-emerald-700'}`;
  const subtitleClass = mapPeekCompact
    ? `text-[10px] font-medium leading-tight ${EXPLORE_TYPE.muted}`
    : `text-xs font-medium ${EXPLORE_TYPE.muted}`;
  const rowGap = mapPeekCompact ? 'gap-2' : 'gap-3';

  const hostRow = showHostRow && hostName ? (
    hostPath ? (
      <Link
        to={hostPath}
        className={`flex items-center ${rowGap} group rounded-xl -mx-1 px-1 py-0.5 hover:bg-neutral-50 transition-colors`}
      >
        <SecureAvatar
          src={hostAvatar}
          name={hostName}
          className={avatarClass}
        />
        <div className="min-w-0 flex-1">
          <p className={subtitleClass}>{hostedByLabel}</p>
          <p className={linkNameClass}>{hostName}</p>
          {hostTrustLine ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-emerald-800">{hostTrustLine}</p>
          ) : showMyHostProfileSubtitle ? (
            <p className={subtitleClass}>{hostProfileSubtitle(ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE)}</p>
          ) : null}
        </div>
        <ChevronRight className={`${mapPeekCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-400 shrink-0`} />
      </Link>
    ) : hostProfilePath && isGuestViewer ? (
      <button
        type="button"
        onClick={onGuestGatedAction}
        className={`flex w-full items-center ${rowGap} rounded-xl -mx-1 px-1 py-0.5 text-left hover:bg-neutral-50 transition-colors`}
      >
        <SecureAvatar
          src={hostAvatar}
          name={hostName}
          className={avatarClass}
        />
        <div className="min-w-0 flex-1">
          <p className={subtitleClass}>{hostedByLabel}</p>
          <p className={nameClass}>{hostName}</p>
          {hostTrustLine ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-emerald-800">{hostTrustLine}</p>
          ) : null}
        </div>
        <ChevronRight className={`${mapPeekCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-400 shrink-0`} />
      </button>
    ) : (
      <div className={`flex items-center ${rowGap}`}>
        <SecureAvatar
          src={hostAvatar}
          name={hostName}
          className={avatarClassPlain}
        />
        <div className="min-w-0">
          <p className={subtitleClass}>{hostedByLabel}</p>
          <p className={nameClass}>{hostName}</p>
          {hostTrustLine ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-emerald-800">{hostTrustLine}</p>
          ) : peekGuideCountLine ? (
            <p className={subtitleClass}>{hostProfileSubtitle(peekGuideCountLine)}</p>
          ) : null}
        </div>
      </div>
    )
  ) : null;

  return (
    <div
      className={
        compactSection
          ? mapPeekCompact
            ? 'space-y-2'
            : 'space-y-4'
          : 'mt-5 border-t border-neutral-100 pt-4 space-y-4'
      }
    >
      {hostRow}
      {showHostProfileProUpsell ? (
        <p className="text-xs leading-relaxed text-amber-900/90">
          {ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT}{' '}
          <Link
            to={proMembershipPath({ intent: 'discover-members' })}
            className="font-semibold text-emerald-700 hover:underline"
          >
            {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
          </Link>
        </p>
      ) : null}
      {showRosterProUpsell ? (
        <p className="text-xs leading-relaxed text-amber-900/90">
          {ACTIVITY_DETAIL_PRO_ROSTER_HINT}{' '}
          <Link
            to={proMembershipPath({ intent: 'discover-members' })}
            className="font-semibold text-emerald-700 hover:underline"
          >
            {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
          </Link>
        </p>
      ) : null}
      {visibleParticipants.length > 0 && (
        <div>
          <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${EXPLORE_TYPE.muted}`}>
            Who&apos;s going ({showRosterProUpsell ? visibleParticipants.length : participants.length})
          </p>
          <ParticipantPreview
            participants={visibleParticipants}
            size="md"
            linkToProfile={!onGuestGatedAction}
            onGuestProfileClick={onGuestGatedAction}
          />
        </div>
      )}
    </div>
  );
};

export const DiscoveryCardTypeBadge = ({
  card,
  size = 'md',
}: {
  card: DiscoveryCardModel;
  size?: 'sm' | 'md';
}) => (
  <DiscoveryCardTypeIcon
    tone={card.tone}
    source={card.source}
    kind={card.kind}
    emoji={card.emoji}
    size={size}
  />
);

/** Venue image overlays — kids friendly (left), difficulty or surface type (right). */
export const ExploreVenueImageBadges = ({ card }: { card: DiscoveryCardModel }) => {
  if (!isGeographyMapSource(card.source)) return null;

  const rightBadge =
    card.kind === 'hiking' && card.difficulty
      ? capitalize(card.difficulty)
      : card.kind === 'camping' && card.surfaceTypes && card.surfaceTypes.length > 0
        ? card.surfaceTypes.map(capitalize).join(' · ')
        : null;

  if (!card.childFriendly && !rightBadge) return null;

  return (
    <>
      {card.childFriendly ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-sm">
          Kids friendly
        </span>
      ) : null}
      {rightBadge ? (
        <span className={`absolute right-14 top-3 max-w-[55%] truncate rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold ${EXPLORE_TYPE.title} backdrop-blur-sm`}>
          {rightBadge}
        </span>
      ) : null}
    </>
  );
};

export const resolveDiscoveryCardCapacityLabel = (card: DiscoveryCardModel): string | null => {
  const activity = card.source === 'activity' ? card.activity : null;
  const slotsTotal = activity?.slotsTotal ?? 0;
  if (activity && slotsTotal > 0) {
    return buildActivitySpotsLeftLabel(activity.slotsAvailable, activity.slotsTotal, {
      participantCount: card.participantPreviews?.length,
      countsGoing: activity.counts?.going,
    });
  }
  return card.sections.partyLabel?.trim() || null;
};

export const DiscoveryCardCapacityRow = ({
  card,
  compact = false,
}: {
  card: DiscoveryCardModel;
  compact?: boolean;
}) => {
  const label = resolveDiscoveryCardCapacityLabel(card);
  if (!label) return null;

  const activity = card.source === 'activity' && (card.activity?.slotsTotal ?? 0) > 0;

  return (
    <p
      className={`${compact ? 'text-xs' : 'text-sm'} font-medium break-words leading-snug ${EXPLORE_TYPE.body}`}
    >
      <span className={`font-semibold ${activity ? '' : 'tabular-nums'}`}>{label}</span>
      {!activity && card.sections.partyLabel ? (
        <span
          className={`ml-1 ${compact ? 'text-[10px]' : 'ml-1.5 text-xs'} font-medium ${EXPLORE_TYPE.muted}`}
        >
          spots
        </span>
      ) : null}
    </p>
  );
};

const peekStripShell = 'mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const peekStripLabel =
  'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

/** Map peek — capacity above host; not grouped with rideshare. */
export const ExploreActivityPeekSpotsSection = ({
  card,
  compact = false,
}: {
  card: DiscoveryCardModel;
  compact?: boolean;
}) => {
  if (!discoveryCardActivityShowsPeekSpots(card)) return null;
  const isFull = discoveryCardActivityJoinIsFull(card);
  const shell = compact
    ? 'rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5'
    : peekStripShell;
  const label = compact
    ? 'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500'
    : peekStripLabel;

  return (
    <section className={shell} aria-label={ACTIVITY_PEEK_SECTION_SPOTS}>
      <div className={label}>{ACTIVITY_PEEK_SECTION_SPOTS}</div>
      {isFull ? (
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${EXPLORE_TYPE.body}`}>
          {ACTIVITY_PEEK_FULL_CAPACITY_LABEL}
        </p>
      ) : (
        <DiscoveryCardCapacityRow card={card} compact={compact} />
      )}
    </section>
  );
};
