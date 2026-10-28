/**
 * Standard public `/activity/:id` layout (L3 consumer template).
 *
 * Single source for outing detail UI — no hero image, no photo gallery.
 * Wire CTAs stay on `ActivityDetailView` sticky footer (`ActivityDetailEngagementActions`).
 *
 * Route loader: `pages/ActivityDetail.tsx` · Shell: `ActivityDetailPageShell` · Chrome: `ActivityDetailView`.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { ConsumerDetailLeadDateChip } from '../../../activity/detail/ConsumerDetailLeadDateChip';
import { resolveActivityConsumerRequirementLines } from '../../../activity/activityDetailConsumerRequirements';
import { resolveActivityDetailConsumerAudienceBadges } from '../../../activity/activityDetailConsumerAudienceBadges';
import { shouldShowConsumerDetailLeadVenue } from '../../../activity/activityConsumerDetailLeadVenue';
import {
  ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE,
  ACTIVITY_DETAIL_THIS_OUTING_LABEL,
} from '../../../content/activityDetailCopy';
import { useAuth } from '../../../context/AuthContext';
import { ActivityLinkedParentPlanAffordance } from '../../../components/activity/ActivityLinkedParentPlanAffordance';
import { ActivityLinkedRideshareAffordance } from '../../../components/activity/ActivityLinkedRideshareAffordance';
import {
  resolveActivityLinkedParentSummary,
  resolveActivityLinkedRideshareSummary,
} from '../../../activity/resolveActivityLinkageSummaries';
import { resolveConsumerDetailVenueEyebrow } from '../../../activity/resolveConsumerDetailVenueEyebrow';
import { ConsumerDetailRideshareLinkage } from './ConsumerDetailRideshareLinkage';
import { ConsumerDetailOfferRideshare } from './ConsumerDetailOfferRideshare';
import { ConsumerDetailRideshareEssentials } from './ConsumerDetailRideshareEssentials';
import { ConsumerDetailDriverReviews } from './ConsumerDetailDriverReviews';
import { TenantHostRatingInline } from '../../../components/reviews/TenantHostRatingInline';
import { resolveRideshareSeatsAvailability } from '../../resolveRideshareSeatsAvailability';
import { rideshareCardCoversDirections } from '../../rideshareCardDirections';
import { viewerIsActivityHostUser } from '../../../utils/viewerHostsActivity';
import type { ActivityDetailPlanSectionsComponent } from '../composers';
import { ActivityDetailPlanColumn } from '../../../components/activity/detail/ActivityDetailPlanColumn';
import { activityDetailFriendsGoingLabel } from '../../../activity/activityDetailFriendsGoingLabel';
import { activityDetailPath } from '../../../config/routingCatalog';
import { activityPlaceReturnState } from '../../../explore/mapPeekDetailNavState';
import { buildActivityDetailPageShellCard } from '../activityDetailPageShellCard';
import {
  extractActivityTransportReachLines,
  formatActivityAccessibleBySummary,
} from '../../../activity/activityDetailReachBy';
import type { ActivityDetailHeroStatusChip } from '../../../activity/activityDetailHeroStatus';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import {
  ActivityPeekLinkedTransport,
  activityPeekHasLinkedTransportAffordance,
} from '../../../explore/ui/peek/activity/ActivityPeekLinkedTransport';
import {
  EXPLORE_RIDESHARE_AVAILABLE_LABEL,
} from '../../../explore/createFlowCopy';
import { capitalize } from '../../../utils';
import { activityRegistryPlacePath } from '../../../utils/activityRegistryPlacePath';
import { activityHostAvatar, activityHostName, showTenantBrand } from '../../../utils/hostLabels';
import { DirectionsControl, ParticipantPreview, SecureAvatar } from '../../../components/ui';
import {
  CONSUMER_DETAIL_PANEL,
  CONSUMER_DETAIL_SECTION_TITLE,
} from './activityConsumerDetailSectionStyles';
import { DetailPageLoadingState } from '../../../components/ui/DetailPageLoadingState';
import { DETAIL_LOADING_ACTIVITY } from '../../../content/detailLoadingCopy';

type ActivityDetailViewModel = ReturnType<typeof useActivityDetailViewModel>;

export type ActivityConsumerDetailPageProps = {
  model: ActivityDetailViewModel;
  planSections?: ActivityDetailPlanSectionsComponent | null;
  onRideshareParentLinked?: () => void;
};

export const ActivityConsumerDetailPage = ({
  model,
  planSections = null,
  onRideshareParentLinked,
}: ActivityConsumerDetailPageProps) => {
  const { user } = useAuth();
  if (!model.consumerDetailLayout || model.isEmbedded) {
    return null;
  }

  const layout = model.consumerLayout;
  if (!layout) {
    return <DetailPageLoadingState label={DETAIL_LOADING_ACTIVITY} variant="embedded" />;
  }

  const venueLabel =
    model.registryPlaceName?.trim() || model.activity.locationName?.trim() || '';
  const registryPath = model.registryPlacePath ?? activityRegistryPlacePath(model.activity);
  const hasLinkedPlaceCard = Boolean(
    model.activity.location?.name?.trim() && registryPath
  );
  const isRideshare = model.activity.activityType === 'rideshare';
  const linkedParentSummary = resolveActivityLinkedParentSummary(model.activity);
  const linkedRideshareSummary = resolveActivityLinkedRideshareSummary(model.activity);
  const showLeadVenue = shouldShowConsumerDetailLeadVenue(
    model.activityTitle,
    venueLabel,
    hasLinkedPlaceCard
  );
  const venueLine = showLeadVenue && !isRideshare ? (
    <ConsumerDetailVenueLead
      activity={model.activity}
      activityTitle={model.activityTitle}
      venueLabel={venueLabel}
      placePath={registryPath}
    />
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

  const isRideHost = viewerIsActivityHostUser(model.activity, user?.id);
  const rideHostTenantId =
    isRideHost ? model.linkRideshareTenantId ?? model.activity.tenantId ?? null : null;

  const hostAndSocialBlock =
    !model.requiresSignIn ? (
      <>
        {layout.showHostProfile ? (
          <ConsumerDetailHostRow
            activity={model.activity}
            hostPath={model.hostPath}
            canOpenHostProfile={model.canOpenHostProfile}
            showTenantRating={Boolean(model.activity.tenantId)}
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
          />
        ) : null}
      </>
    ) : null;

  return (
    <div className="w-full pt-1 pb-2" data-activity-consumer-detail-template>
      <ConsumerDetailLead
        activity={model.activity}
        title={model.activityTitle}
        card={model.peekParityCard}
        venueLine={venueLine}
        statusChips={model.consumerStatusChips}
      />

      {isRideshare ? (
        <ConsumerDetailRideshareLinkage
          activity={model.activity}
          isRideHost={isRideHost}
          hostTenantId={rideHostTenantId}
          onParentLinked={onRideshareParentLinked}
        />
      ) : linkedRideshareSummary ? (
        <section className="mt-2" aria-label="Linked rideshare">
          <ActivityLinkedRideshareAffordance rideshare={linkedRideshareSummary} className="mt-0" />
        </section>
      ) : !model.requiresSignIn ? (
        <ConsumerDetailOfferRideshare
          activity={model.activity}
          viewerAccess={model.viewerAccess}
          tenantId={model.linkRideshareTenantId ?? model.activity.tenantId ?? null}
          onCreateRideshare={model.onOfferLinkedRideshare}
          onRideshareLinked={onRideshareParentLinked}
        />
      ) : null}

      {model.requiresSignIn ? <ActivityDetailGuestGate activity={model.activity} /> : null}

      {!isRideshare && !model.requiresSignIn ? hostAndSocialBlock : null}

      <div className="mt-3 space-y-6">
        {isRideshare && !model.requiresSignIn ? (
          <ConsumerDetailRideshareEssentials
            activity={model.activity}
            showVehiclePlate={model.viewerAccess?.canAccessCrewSurfaces === true}
          />
        ) : null}
        <ConsumerDetailPlaceCard
          activity={model.activity}
          hideForLinkedRideshare={isRideshare && Boolean(linkedParentSummary)}
        />
        {!model.requiresSignIn ? (
          <ConsumerDetailGettingThere
            activity={model.activity}
            viewerAccess={model.viewerAccess}
            wireStrips={model.wireStrips}
            showMeetingPoint={layout.showMeetingPoint}
            accessLat={model.accessLat}
            accessLng={model.accessLng}
            hasAccessCoordinates={model.hasAccessCoordinates}
            linkedTransportShownAbove={
              (isRideshare && Boolean(linkedParentSummary)) ||
              (!isRideshare && Boolean(linkedRideshareSummary))
            }
          />
        ) : null}
        {isRideshare && !model.requiresSignIn ? hostAndSocialBlock : null}
        {!model.requiresSignIn ? <ConsumerDetailInstructions activity={model.activity} /> : null}
        <ActivityDetailPlanColumn model={model} planSections={planSections} consumerInline />
        {isRideshare && model.activity.tenantId ? (
          <ConsumerDetailDriverReviews tenantId={model.activity.tenantId} />
        ) : null}
      </div>
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
  const participationChip = participationStatusChip(statusChips);
  const isRideshareLead = activity.activityType === 'rideshare';
  const explorePrice = card?.source === 'activity' ? card.price : null;
  const priceBadge = explorePrice?.badge ?? null;
  const priceBadgeToneClass =
    explorePrice?.kind === 'free'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : explorePrice?.kind === 'shared'
        ? 'border-sky-200 bg-sky-50 text-sky-900'
        : 'border-amber-200 bg-amber-50 text-amber-900';
  const rideshareSeats = isRideshareLead ? resolveRideshareSeatsAvailability(activity) : null;
  const showMetaRow =
    Boolean(leadDate.time && !isRideshareLead) ||
    Boolean(priceBadge) ||
    Boolean(participationChip) ||
    Boolean(rideshareSeats) ||
    audienceBadges.length > 0;

  return (
    <header className="pb-4">
      <div className="flex items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[26px] font-bold leading-[1.15] tracking-tight text-neutral-950">
          {title}
        </h1>
        <ConsumerDetailLeadDateChip leadDate={leadDate} />
      </div>

      {showMetaRow ? (
        <div
          className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5"
          aria-label="Schedule, price, and who this outing is for"
        >
          {leadDate.time && !isRideshareLead ? (
            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
              {leadDate.time}
            </span>
          ) : null}
          {priceBadge ? (
            <span
              className={`inline-flex rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${priceBadgeToneClass}`}
            >
              {priceBadge}
            </span>
          ) : null}
          {rideshareSeats ? (
            <span
              className={`inline-flex rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
                rideshareSeats.isFull
                  ? 'border-neutral-200 bg-neutral-100 text-neutral-700'
                  : 'border-sky-200 bg-sky-50 text-sky-900'
              }`}
            >
              {rideshareSeats.label}
            </span>
          ) : null}
          {participationChip && !rideshareSeats ? (
            <span
              className={`inline-flex items-center rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold ${statusChipToneClass[participationChip.tone]}`}
            >
              {participationChip.label}
            </span>
          ) : null}
          <ConsumerDetailAudienceBadges badges={audienceBadges} />
        </div>
      ) : null}

      {venueLine ? <div className="mt-2">{venueLine}</div> : null}
    </header>
  );
};

const ConsumerDetailVenueLead = ({
  activity,
  activityTitle,
  venueLabel,
  placePath,
}: {
  activity: ActivityDetailDTO;
  activityTitle: string;
  venueLabel: string;
  placePath: string | null;
}) => {
  const venueEyebrow = resolveConsumerDetailVenueEyebrow(activity, placePath);
  const outingPath = activityDetailPath(activity.id);
  const linkedParent = activity.linkedParentActivity;
  const isRideshare = activity.activityType === 'rideshare';

  const linkedParentRow =
    linkedParent && !isRideshare ? (
      <ActivityLinkedParentPlanAffordance parent={linkedParent} className="mt-0" />
    ) : null;

  const outingRow =
    isRideshare && linkedParent ? null : (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {ACTIVITY_DETAIL_THIS_OUTING_LABEL}
        </p>
        <Link
          to={outingPath}
          className="mt-0.5 block text-sm font-semibold leading-snug text-emerald-900 hover:underline"
        >
          {activityTitle}
        </Link>
      </div>
    );

  const venueRow = (
    <div
      className={
        linkedParentRow || outingRow ? 'mt-2.5 border-t border-emerald-200/50 pt-2.5' : ''
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/80">{venueEyebrow}</p>
      {placePath ? (
        <Link
          to={placePath}
          state={activityPlaceReturnState(outingPath)}
          className="mt-0.5 block text-sm font-semibold leading-snug text-emerald-900 hover:underline"
        >
          {venueLabel}
        </Link>
      ) : (
        <p className="mt-0.5 text-sm font-medium leading-snug text-emerald-800">{venueLabel}</p>
      )}
      {placePath ? (
        <p className="mt-1 text-xs font-medium leading-snug text-emerald-800/90">
          {ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-3 py-2.5 space-y-0">
      {linkedParentRow}
      {outingRow}
      {venueRow}
    </div>
  );
};

const ConsumerDetailSocialRow = ({
  activity,
  participants,
  rosterParticipants,
  buddyUserIdsOnActivity = [],
  canOpenFullRoster = false,
}: {
  activity: ActivityDetailDTO;
  participants: NonNullable<ActivityDetailDTO['participants']>;
  rosterParticipants: NonNullable<ActivityDetailDTO['participants']>;
  buddyUserIdsOnActivity?: string[];
  canOpenFullRoster?: boolean;
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
  showMeetingPoint = false,
  accessLat,
  accessLng,
  hasAccessCoordinates,
  linkedTransportShownAbove = false,
}: {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
  showMeetingPoint?: boolean;
  accessLat: number | null;
  accessLng: number | null;
  hasAccessCoordinates: boolean;
  /** Linked parent / rideshare card already rendered under the title. */
  linkedTransportShownAbove?: boolean;
}) => {
  const navigate = useNavigate();
  const card = useMemo(
    () => buildActivityDetailPageShellCard({ activity, viewerAccess, wireStrips }),
    [activity, viewerAccess, wireStrips]
  );

  const accessibleBy = formatActivityAccessibleBySummary(activity.requirements);
  const reachLines = extractActivityTransportReachLines(activity.requirements);
  const peekLinkedTransport = activityPeekHasLinkedTransportAffordance(card);
  const showLinkedTransportInSection = peekLinkedTransport && !linkedTransportShownAbove;
  const showRideshareOpenOffer =
    Boolean(activity.rideshareEnabled) &&
    !peekLinkedTransport &&
    card.source === 'activity';
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
  const directionsOnRideCard =
    hasDirections && rideshareCardCoversDirections(activity, dirLat as number, dirLng as number);
  const meetingLabel =
    activity.meetingPoint?.trim() ||
    activity.startPoint?.trim() ||
    activity.parkingPoint?.trim() ||
    null;
  const showMeetingBlock = showMeetingPoint && (Boolean(meetingLabel) || hasAccessCoordinates);

  if (
    !accessibleBy &&
    reachLines.length === 0 &&
    !showLinkedTransportInSection &&
    !showRideshareOpenOffer &&
    (!hasDirections || directionsOnRideCard) &&
    !showMeetingBlock
  ) {
    return null;
  }

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
        {showLinkedTransportInSection ? (
          <ActivityPeekLinkedTransport card={card} onOpenLinkedPin={onOpenLinkedActivity} />
        ) : null}
        {hasDirections && !directionsOnRideCard ? (
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

const ConsumerDetailPlaceCard = ({
  activity,
  hideForLinkedRideshare = false,
}: {
  activity: ActivityDetailDTO;
  hideForLinkedRideshare?: boolean;
}) => {
  if (hideForLinkedRideshare) return null;
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
    <Link
      to={placePath}
      state={activityPlaceReturnState(activityDetailPath(activity.id))}
      className={CONSUMER_DETAIL_PANEL.place}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 shadow-inner">
        <MapPin className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">{kindLabel}</p>
        <p className="truncate text-[15px] font-semibold text-neutral-950">{name}</p>
        <p className="mt-0.5 text-xs font-medium text-emerald-800/90">
          {ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE}
        </p>
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
  showTenantRating = false,
}: {
  activity: ActivityDetailDTO;
  hostPath: string | null;
  canOpenHostProfile: boolean;
  showTenantRating?: boolean;
}) => {
  const name = activityHostName(activity);
  const tenant = showTenantBrand(activity) ? activity.tenantName : null;
  const tenantId = activity.tenantId?.trim() || null;
  const ratingVariant = activity.activityType === 'rideshare' ? 'driver' : 'host';
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
        {showTenantRating && tenantId ? (
          <TenantHostRatingInline
            tenantId={tenantId}
            variant={ratingVariant}
            linkToReviews={false}
          />
        ) : null}
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
