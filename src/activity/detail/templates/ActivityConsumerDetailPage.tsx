/**
 * Standard public `/activity/:id` layout (L3 consumer template).
 *
 * Single source for outing detail UI — no hero image, no photo gallery.
 * Wire CTAs stay on `ActivityDetailView` sticky footer (`ActivityDetailEngagementActions`).
 *
 * Route loader: `pages/ActivityDetail.tsx` · Shell: `ActivityDetailPageShell` · Chrome: `ActivityDetailView`.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Car } from 'lucide-react';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { useActivityDetailViewModel } from '../../../components/activity/detail/useActivityDetailViewModel';
import { ActivityDetailGuestGate } from '../../../components/activity/detail/ActivityDetailGuestGate';
import { ActivityDetailParticipantsRosterDialog } from '../../../components/activity/detail/ActivityDetailParticipantsRosterDialog';
import { activityDetailParticipantCountLabel } from '../../../components/activity/detail/activityDetailParticipantCountLabel';
import { formatActivityDetailConsumerLeadDate } from '../../../activity/formatActivityDetailConsumerLead';
import { resolveActivityConsumerRequirementLines } from '../../../activity/activityDetailConsumerRequirements';
import { resolveActivityDetailConsumerAudienceBadges } from '../../../activity/activityDetailConsumerAudienceBadges';
import { shouldShowConsumerDetailLeadVenue } from '../../../activity/activityConsumerDetailLeadVenue';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../../content/activityInviteCopy';
import { activityDetailFriendsGoingLabel } from '../../../activity/activityDetailFriendsGoingLabel';
import { activityDetailPath } from '../../../config/routingCatalog';
import { buildActivityDetailPageShellCard } from '../activityDetailPageShellCard';
import {
  extractActivityTransportReachLines,
  formatActivityAccessibleBySummary,
} from '../../../activity/activityDetailReachBy';
import { resolveActivityMapPeekStrips } from '../../../activity/activityPeekEngagement';
import type { ActivityDetailHeroStatusChip } from '../../../activity/activityDetailHeroStatus';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import {
  ActivityPeekLinkedTransport,
  activityPeekHasLinkedTransportAffordance,
} from '../../../explore/ui/peek/activity/ActivityPeekLinkedTransport';
import {
  EXPLORE_RIDESHARE_AVAILABLE_LABEL,
  HOSTING_LINK_RIDESHARE_LABEL,
} from '../../../explore/createFlowCopy';
import { navigateToAuthGate } from '../../../utils/authReturnContext';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { capitalize } from '../../../utils';
import { activityRegistryPlacePath } from '../../../utils/activityRegistryPlacePath';
import { activityHostAvatar, activityHostName, showTenantBrand } from '../../../utils/hostLabels';
import { DirectionsControl, ParticipantPreview, SecureAvatar } from '../../../components/ui';
import {
  CONSUMER_DETAIL_PANEL,
  CONSUMER_DETAIL_SECTION_TITLE,
} from './activityConsumerDetailSectionStyles';

type ActivityDetailViewModel = ReturnType<typeof useActivityDetailViewModel>;

export type ActivityConsumerDetailPageProps = {
  model: ActivityDetailViewModel;
  canInviteFriends?: boolean;
  onInviteFriends?: () => void;
};

export const ActivityConsumerDetailPage = ({
  model,
  canInviteFriends = false,
  onInviteFriends,
}: ActivityConsumerDetailPageProps) => {
  if (!model.consumerDetailLayout || model.isEmbedded) {
    return null;
  }

  const layout = model.consumerLayout;
  if (!layout) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <p className="text-sm text-neutral-600" role="status">
          Loading activity details…
        </p>
      </div>
    );
  }

  const venueLabel =
    model.registryPlaceName?.trim() || model.activity.locationName?.trim() || '';
  const hasLinkedPlaceCard = Boolean(
    model.activity.location?.name?.trim() && activityRegistryPlacePath(model.activity)
  );
  const showLeadVenue = shouldShowConsumerDetailLeadVenue(
    model.activityTitle,
    venueLabel,
    hasLinkedPlaceCard
  );
  const venueLine =
    showLeadVenue && model.registryPlacePath && model.registryPlaceName ? (
      <Link to={model.registryPlacePath} className="text-emerald-800 hover:underline">
        {model.registryPlaceName}
      </Link>
    ) : showLeadVenue ? (
      model.activity.locationName
    ) : null;

  const showParticipantsRow = layout.participants !== 'hidden';

  const rosterPreview =
    model.rosterParticipants.length > 0
      ? model.rosterParticipants
      : (model.activity.participantPreviews ?? []).map((row) => ({
          id: row.id,
          name: row.name ?? 'Member',
          avatar: row.avatar ?? null,
        }));

  return (
    <div className="w-full pt-1 pb-2" data-activity-consumer-detail-template>
      <ConsumerDetailLead
        activity={model.activity}
        title={model.activityTitle}
        card={model.peekParityCard}
        venueLine={venueLine}
        statusChips={model.consumerStatusChips}
      />

      {model.requiresSignIn ? (
        <ActivityDetailGuestGate activity={model.activity} />
      ) : (
        <>
          {layout.showHostProfile ? (
            <ConsumerDetailHostRow
              activity={model.activity}
              hostPath={model.hostPath}
              canOpenHostProfile={model.canOpenHostProfile}
            />
          ) : null}

          {showParticipantsRow ? (
            <ConsumerDetailSocialRow
              activity={model.activity}
              participants={model.participants}
              rosterParticipants={
                layout.participants === 'roster' ? model.rosterParticipants : rosterPreview
              }
              buddyUserIdsOnActivity={
                model.viewerAccess?.entitlements?.buddyUserIdsOnActivity ?? []
              }
              canOpenFullRoster={layout.canOpenParticipantRoster}
              showInviteAction={canInviteFriends}
              onInviteFriends={onInviteFriends}
            />
          ) : null}

          <div className="mt-3 space-y-6">
            <ConsumerDetailPlaceCard activity={model.activity} />
            <ConsumerDetailGettingThere
              activity={model.activity}
              viewerAccess={model.viewerAccess}
              wireStrips={model.wireStrips}
              joinUiState={model.joinUiState}
              requiresSignIn={model.requiresSignIn}
              onOfferLinkedRideshare={model.onOfferLinkedRideshare}
              showMeetingPoint={layout.showMeetingPoint}
              accessLat={model.accessLat}
              accessLng={model.accessLng}
              hasAccessCoordinates={model.hasAccessCoordinates}
            />
            <ConsumerDetailInstructions activity={model.activity} />
          </div>
        </>
      )}
    </div>
  );
};

// ——— Template sections (private to this file) ———

const statusChipToneClass: Record<ActivityDetailHeroStatusChip['tone'], string> = {
  neutral: 'bg-neutral-100 text-neutral-800',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  muted: 'bg-neutral-100 text-neutral-500',
};

const participationStatusChip = (
  chips: ActivityDetailHeroStatusChip[]
): ActivityDetailHeroStatusChip | null => {
  const joinChip = chips.find((chip) => chip.tone === 'success' || chip.tone === 'warning');
  return joinChip ?? chips.find((chip) => chip.label === 'Full') ?? null;
};

const audienceBadgeClass = (badge: string): string => {
  const normalized = badge.toLowerCase();
  if (normalized.includes('women')) return 'border-rose-200 bg-rose-50 text-rose-900';
  if (normalized.includes('kids') || normalized.includes('children')) {
    return 'border-sky-200 bg-sky-50 text-sky-900';
  }
  if (normalized.includes('pet')) return 'border-amber-200 bg-amber-50 text-amber-950';
  if (normalized.startsWith('ages')) return 'border-violet-200 bg-violet-50 text-violet-900';
  if (normalized.includes('family')) return 'border-indigo-200 bg-indigo-50 text-indigo-900';
  return 'border-neutral-200 bg-white text-neutral-800';
};

const ConsumerDetailAudienceBadges = ({ badges }: { badges: string[] }) => {
  if (badges.length === 0) return null;
  return (
    <>
      {badges.map((badge) => (
        <span
          key={badge}
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${audienceBadgeClass(badge)}`}
        >
          {badge}
        </span>
      ))}
    </>
  );
};

const ConsumerDetailLead = ({
  activity,
  title,
  card,
  venueLine,
  statusChips,
}: {
  activity: ActivityDetailDTO;
  title: string;
  card: DiscoveryCardModel | null;
  venueLine: ReactNode;
  statusChips: ActivityDetailHeroStatusChip[];
}) => {
  const leadDate = formatActivityDetailConsumerLeadDate(activity.date, activity.time);
  const audienceBadges = resolveActivityDetailConsumerAudienceBadges(activity.requirements);
  const priceBadge = card?.source === 'activity' && card.price ? card.price.badge : null;

  const participationChip = participationStatusChip(statusChips);
  const hasFactLabels = Boolean(participationChip) || audienceBadges.length > 0;

  return (
    <header className="pb-4">
      <div className="flex items-start gap-3">
        <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-[1.15] tracking-tight text-neutral-950">
          {title}
        </h1>
        <div
          className="flex w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 px-1.5 py-2.5 text-center text-white shadow-sm"
          aria-hidden
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/90">
            {leadDate.month}
          </span>
          <span className="text-2xl font-bold leading-none">{leadDate.day}</span>
        </div>
      </div>

      <p className="mt-2 text-[15px] font-semibold leading-snug text-neutral-800">
        {leadDate.weekday}
        {leadDate.time ? (
          <>
            <span className="font-normal text-neutral-400"> · </span>
            {leadDate.time}
          </>
        ) : null}
        {priceBadge ? (
          <>
            <span className="font-normal text-neutral-400"> · </span>
            <span
              className={card?.price?.kind === 'free' ? 'text-emerald-700' : 'text-amber-800'}
            >
              {priceBadge}
            </span>
          </>
        ) : null}
      </p>

      {hasFactLabels ? (
        <div
          className="mt-2.5 flex flex-wrap items-center gap-2"
          aria-label="Outing status and who it is for"
        >
          {participationChip ? (
            <span
              className={`inline-flex items-center rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold ${statusChipToneClass[participationChip.tone]}`}
            >
              {participationChip.label}
            </span>
          ) : null}
          <ConsumerDetailAudienceBadges badges={audienceBadges} />
        </div>
      ) : null}

      {venueLine ? (
        <p className="mt-2 text-sm font-medium leading-snug text-emerald-800">{venueLine}</p>
      ) : null}
    </header>
  );
};

const ConsumerDetailSocialRow = ({
  activity,
  participants,
  rosterParticipants,
  buddyUserIdsOnActivity = [],
  canOpenFullRoster = false,
  onInviteFriends,
  showInviteAction = false,
}: {
  activity: ActivityDetailDTO;
  participants: NonNullable<ActivityDetailDTO['participants']>;
  rosterParticipants: NonNullable<ActivityDetailDTO['participants']>;
  buddyUserIdsOnActivity?: string[];
  canOpenFullRoster?: boolean;
  onInviteFriends?: () => void;
  showInviteAction?: boolean;
}) => {
  const [rosterOpen, setRosterOpen] = useState(false);
  const countLabel = activityDetailParticipantCountLabel(activity);
  const friendsGoingLabel = activityDetailFriendsGoingLabel(buddyUserIdsOnActivity);
  const rosterAriaLabel = [
    countLabel,
    friendsGoingLabel,
    "view who's going",
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <section className="mt-4" aria-label="Going">
      <p className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Going</p>
      <div className={`flex items-center gap-3 ${CONSUMER_DETAIL_PANEL.social}`}>
      <button
        type="button"
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${canOpenFullRoster ? 'active:opacity-90' : 'pointer-events-none'}`}
        onClick={() => canOpenFullRoster && setRosterOpen(true)}
        disabled={!canOpenFullRoster}
        aria-label={rosterAriaLabel}
      >
        <ParticipantPreview
          participants={rosterParticipants}
          size="sm"
          showNames={false}
          linkToProfile={false}
          emptyLabel="Be the first to join"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          {countLabel ? (
            <span className="text-sm font-medium tabular-nums text-neutral-500">{countLabel}</span>
          ) : null}
          {friendsGoingLabel ? (
            <span className="text-xs font-semibold text-emerald-700">{friendsGoingLabel}</span>
          ) : null}
        </div>
      </button>
      {showInviteAction && onInviteFriends ? (
        <button
          type="button"
          onClick={onInviteFriends}
          className="shrink-0 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-700/30 active:bg-emerald-700"
        >
          {ACTIVITY_INVITE_FRIENDS_CTA}
        </button>
      ) : null}
      <ActivityDetailParticipantsRosterDialog
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        participants={participants}
        titleSuffix={countLabel ?? undefined}
      />
      </div>
    </section>
  );
};

type ConsumerDetailPanelTone = 'logistics' | 'prep';

const ConsumerDetailOpenSection = ({
  title,
  children,
  id,
  icon,
  tone = 'logistics',
}: {
  title: string;
  children: ReactNode;
  id?: string;
  icon?: ReactNode;
  tone?: ConsumerDetailPanelTone;
}) => (
  <section id={id} className="scroll-mt-24">
    <div className="mb-2.5 flex items-center gap-2">
      {icon}
      <h2 className={CONSUMER_DETAIL_SECTION_TITLE}>{title}</h2>
    </div>
    <div
      className={`text-sm leading-relaxed text-neutral-800 ${
        tone === 'prep' ? CONSUMER_DETAIL_PANEL.prep : CONSUMER_DETAIL_PANEL.logistics
      }`}
    >
      {children}
    </div>
  </section>
);

const ConsumerDetailInstructions = ({ activity }: { activity: ActivityDetailDTO }) => {
  const lines = resolveActivityConsumerRequirementLines(activity.requirements);
  if (lines.length === 0) return null;
  return (
    <ConsumerDetailOpenSection id="activity-detail-instructions" title="Instructions" tone="prep">
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-emerald-600" aria-hidden>•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </ConsumerDetailOpenSection>
  );
};

const ConsumerDetailGettingThere = ({
  activity,
  viewerAccess,
  wireStrips,
  joinUiState,
  requiresSignIn = false,
  onOfferLinkedRideshare,
  showMeetingPoint = false,
  accessLat,
  accessLng,
  hasAccessCoordinates,
}: {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
  joinUiState: JoinRequestUiState;
  requiresSignIn?: boolean;
  onOfferLinkedRideshare?: () => void;
  showMeetingPoint?: boolean;
  accessLat: number | null;
  accessLng: number | null;
  hasAccessCoordinates: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const card = useMemo(
    () => buildActivityDetailPageShellCard({ activity, viewerAccess, wireStrips }),
    [activity, viewerAccess, wireStrips]
  );

  const accessibleBy = formatActivityAccessibleBySummary(activity.requirements);
  const reachLines = extractActivityTransportReachLines(activity.requirements);
  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  const entitlements = viewerAccess?.entitlements;
  const showOfferTransport =
    Boolean(onOfferLinkedRideshare) &&
    (strips.showOfferRideInLogistics ||
      Boolean(entitlements?.canOfferTransport) ||
      Boolean(entitlements?.canAddLinkedRide));
  const hasRideshareAffordance = activityPeekHasLinkedTransportAffordance(card);
  const showRideshareOpenOffer =
    Boolean(activity.rideshareEnabled) && !hasRideshareAffordance && card.source === 'activity';
  const dirLat =
    accessLat ??
    activity.startLat ??
    activity.meetingLat ??
    activity.parkingLat ??
    activity.displayLatitude ??
    activity.location?.latitude ??
    null;
  const dirLng =
    accessLng ??
    activity.startLng ??
    activity.meetingLng ??
    activity.parkingLng ??
    activity.displayLongitude ??
    activity.location?.longitude ??
    null;
  const hasDirections = dirLat != null && dirLng != null;
  const meetingLabel =
    activity.meetingPoint?.trim() ||
    activity.startPoint?.trim() ||
    activity.parkingPoint?.trim() ||
    null;
  const showMeetingBlock = showMeetingPoint && (Boolean(meetingLabel) || hasAccessCoordinates);

  if (
    !accessibleBy &&
    reachLines.length === 0 &&
    !hasRideshareAffordance &&
    !showRideshareOpenOffer &&
    !showOfferTransport &&
    !hasDirections &&
    !showMeetingBlock
  ) {
    return null;
  }

  const onGuestGatedAction = requiresSignIn
    ? () => navigateToAuthGate(navigate, location, { returnPath: activityDetailPath(activity.id) })
    : undefined;

  const onOpenLinkedActivity = (exploreItemId: string) => {
    const activityId = exploreItemId.startsWith('activity:')
      ? exploreItemId.slice('activity:'.length)
      : exploreItemId;
    navigate(activityDetailPath(activityId));
  };

  return (
    <ConsumerDetailOpenSection
      id="activity-detail-transport"
      title="Getting there"
      icon={<Car className="h-4 w-4 text-sky-700/80" aria-hidden />}
    >
      <div className="space-y-3">
        {accessibleBy ? (
          <p>
            <span className="font-semibold text-neutral-950">Vehicle:</span> {accessibleBy}
          </p>
        ) : null}
        {reachLines.length > 0 ? (
          <ul className="space-y-1">
            {reachLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {showRideshareOpenOffer ? (
          <p className="text-sm font-semibold text-sky-800">{EXPLORE_RIDESHARE_AVAILABLE_LABEL}</p>
        ) : null}
        {showMeetingBlock ? (
          <div id="activity-detail-meeting-point" className="border-t border-neutral-200/80 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Meeting point</p>
            {meetingLabel ? <p className="mt-1 font-medium text-neutral-950">{meetingLabel}</p> : null}
          </div>
        ) : null}
        {hasRideshareAffordance ? (
          <ActivityPeekLinkedTransport card={card} onOpenLinkedPin={onOpenLinkedActivity} />
        ) : null}
        {showOfferTransport ? (
          <button
            type="button"
            onClick={onGuestGatedAction ?? onOfferLinkedRideshare}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-sky-900 active:bg-sky-50"
          >
            {HOSTING_LINK_RIDESHARE_LABEL}
          </button>
        ) : null}
        {hasDirections ? (
          <DirectionsControl
            lat={dirLat as number}
            lng={dirLng as number}
            variant="link"
            label="Get directions"
            showAppPickerAffordance={false}
            showLeadingIcon
            linkClassName="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 active:text-emerald-900"
          />
        ) : null}
      </div>
    </ConsumerDetailOpenSection>
  );
};

const placeStatLine = (activity: ActivityDetailDTO): string | null => {
  const place = activity.location;
  if (!place) return null;
  const parts: string[] = [];
  if (place.distance != null && place.distance > 0) parts.push(`${place.distance} km`);
  if (place.difficulty) parts.push(capitalize(place.difficulty));
  if (place.elevation != null && place.elevation > 0) parts.push(`${place.elevation} m gain`);
  return parts.length > 0 ? parts.join(' · ') : null;
};

const ConsumerDetailPlaceCard = ({ activity }: { activity: ActivityDetailDTO }) => {
  const place = activity.location;
  const placePath = activityRegistryPlacePath(activity);
  if (!place || !placePath) return null;
  const name = place.name?.trim();
  if (!name) return null;

  const stats = placeStatLine(activity);
  const placeKind = place.activityType;
  const kindLabel =
    placeKind === 'camping' ? 'Camp spot' : placeKind === 'hiking' ? 'Trail' : 'Place';

  return (
    <section aria-label="Where">
      <p className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Where</p>
    <Link to={placePath} className={CONSUMER_DETAIL_PANEL.place}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 shadow-inner">
        <MapPin className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">{kindLabel}</p>
        <p className="truncate text-[15px] font-semibold text-neutral-950">{name}</p>
        {stats ? <p className="truncate text-sm text-neutral-600">{stats}</p> : null}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700/50" aria-hidden />
    </Link>
    </section>
  );
};

const ConsumerDetailHostRow = ({
  activity,
  hostPath,
  canOpenHostProfile,
}: {
  activity: ActivityDetailDTO;
  hostPath: string | null;
  canOpenHostProfile: boolean;
}) => {
  const name = activityHostName(activity);
  const tenant = showTenantBrand(activity) ? activity.tenantName : null;
  const inner = (
    <>
      <SecureAvatar
        src={activityHostAvatar(activity)}
        name={name}
        className="h-10 w-10 shrink-0 text-sm ring-2 ring-white"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500">Hosted by</p>
        <p className="truncate text-[15px] font-semibold text-neutral-950">{name}</p>
        {tenant ? <p className="truncate text-sm text-neutral-600">{tenant}</p> : null}
      </div>
      {canOpenHostProfile && hostPath ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
      ) : null}
    </>
  );

  const shell = `mt-4 flex items-center gap-3 ${CONSUMER_DETAIL_PANEL.trust} active:opacity-95`;

  if (canOpenHostProfile && hostPath) {
    return (
      <section aria-label="Host">
        <p className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Host</p>
        <Link to={hostPath} className={shell}>{inner}</Link>
      </section>
    );
  }
  return (
    <section aria-label="Host">
      <p className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Host</p>
      <div className={shell}>{inner}</div>
    </section>
  );
};
