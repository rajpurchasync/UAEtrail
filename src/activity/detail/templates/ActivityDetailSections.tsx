/**
 * Public `/activity/:id` sections. Embed uses `ActivityDetailBody` with the same `presentation.sections`.
 *
 * Single source for outing detail UI — no hero image, no photo gallery.
 * Wire CTAs stay on `ActivityDetailView` sticky footer (`ActivityDetailEngagementActions`).
 *
 * Route loader: `pages/ActivityDetail.tsx` · Shell: `ActivityDetailPageShell` · Chrome: `ActivityDetailView`.
 */
import { useMemo, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Car } from 'lucide-react';
import {
  activityScheduleSpanLabel,
  formatExploreTime,
  hasPackingList,
  type ActivityDetailDTO,
  type ActivityEngagementStripsDTO,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { useActivityDetailViewModel } from '../../../components/activity/detail/useActivityDetailViewModel';
import { ActivityDetailGuestGate } from '../../../components/activity/detail/ActivityDetailGuestGate';
import { activityCrewPendingReviewLabel } from '../../../content/activityParticipantsCopy';
import { activityDetailParticipantCountLabel } from '../../../components/activity/detail/activityDetailParticipantCountLabel';
import { formatActivityDetailLeadDate } from '../../../activity/formatActivityDetailLead';
import { ActivityDetailLeadDateChip } from '../../../activity/detail/ActivityDetailLeadDateChip';
import { resolveActivityDetailRequirementLines } from '../../../activity/activityDetailRequirements';
import { ActivityPackingListPreview } from '../../../components/activity/ActivityPackingListPreview';
import { resolveActivityDetailAudienceBadges } from '../../../activity/activityDetailAudienceBadges';
import { shouldShowActivityDetailLeadVenue } from '../../../activity/activityDetailLeadVenue';
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
import {
  resolveActivityDetailVenueEyebrow,
  resolveActivityDetailVenueKindLabel,
} from '../../../activity/resolveActivityDetailVenueEyebrow';
import { UaeTrailBrandMark } from '../../../components/layout/UaeTrailBrandMark';
import { SITE_TITLE_BRAND } from '../../../config/seo';
import { ActivityDetailRideshareLinkage } from './ActivityDetailRideshareLinkage';
import { ActivityDetailOfferRideshare } from './ActivityDetailOfferRideshare';
import { ActivityDetailRideshareEssentials } from './ActivityDetailRideshareEssentials';
import { ActivityHostReviewSection } from './ActivityHostReviewSection';
import { TenantHostRatingInline } from '../../../components/reviews/TenantHostRatingInline';
import { resolveRideshareSeatsAvailability } from '../../resolveRideshareSeatsAvailability';
import { rideshareCardCoversDirections } from '../../rideshareCardDirections';
import { viewerIsActivityHostUser } from '../../../utils/viewerHostsActivity';
import type { ActivityDetailPlanSectionsComponent } from '../composers';
import { ActivityDetailPlanColumn } from '../../../components/activity/detail/ActivityDetailPlanColumn';
import { activityDetailFriendsGoingLabel } from '../../../activity/activityDetailFriendsGoingLabel';
import { activityCrewPath, activityDetailPath } from '../../../config/routingCatalog';
import { activityPlaceReturnState } from '@/discovery/discoveryPortExploreMapPeekNav';
import { buildActivityDetailPageShellCard } from '../activityDetailPageShellCard';
import { resolveActivityDetailGeoHero } from '../resolveActivityDetailGeoHero';
import { ConsumerDetailHeroGeoLine } from '../../../detail/shared/ConsumerDetailHeroGeoLine';
import { useGeoAncestorLinks } from '../../../hooks/useGeoAncestorLinks';
import { consumerDetailChildLinkState } from '@/discovery/discoveryPortExploreMapPeekNav';
import { resolveActivityDetailHeaderChrome } from '../../activityDetailHeaderChrome';
import {
  extractActivityTransportReachLines,
  formatActivityAccessibleBySummary,
} from '../../../activity/activityDetailReachBy';
import type { ActivityDetailHeroStatusChip } from '../../../activity/activityDetailHeroStatus';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import {
  ActivityPeekLinkedTransport,
  activityPeekHasLinkedTransportAffordance,
} from '@/discovery/discoveryPortExplorePeekLinkedTransport';
import { EXPLORE_RIDESHARE_AVAILABLE_LABEL } from '@/discovery/discoveryPortExploreCreateFlowCopy';
import { capitalize } from '../../../utils';
import { activityRegistryPlacePath } from '../../../utils/activityRegistryPlacePath';
import { activityHostAvatar, showTenantBrand } from '../../../utils/hostLabels';
import { ActivityGuidesList } from '../../../activity/ActivityGuidesList';
import { activityPublisherFromDetail } from '../../../activity/activityPublisherDisplay';
import { ActivityGuideInviteBanner } from '../../../activity/ActivityGuideInviteBanner';
import { DirectionsControl, ParticipantPreview, SecureAvatar } from '../../../components/ui';
import {
  DETAIL_SCROLL_PANEL,
  DETAIL_SCROLL_SECTION_TITLE,
} from '../../../components/mobile/detailScrollSectionStyles';
import {
  ConsumerDetailHostManageSection,
  type ActivityHostManageSurfaceProps,
} from '../../../components/activity/ConsumerDetailHostManageSection';
import { ConsumerDetailHostParticipantsSection } from '../../../components/activity/ConsumerDetailHostParticipantsSection';
type ActivityDetailViewModel = ReturnType<typeof useActivityDetailViewModel>;

export type ActivityDetailSectionsProps = {
  model: ActivityDetailViewModel;
  planSections?: ActivityDetailPlanSectionsComponent | null;
  onRideshareParentLinked?: () => void;
  hostManageSurface?: ActivityHostManageSurfaceProps | null;
};

export const ActivityDetailSections = ({
  model,
  planSections = null,
  onRideshareParentLinked,
  hostManageSurface = null,
}: ActivityDetailSectionsProps) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!model.publicDetail) {
    return null;
  }

  const sections = model.sections;
  const showHostProfile = sections?.showHostProfile === true;
  const participantSlot = sections?.participants ?? 'hidden';
  const showMeetingPoint = sections?.showMeetingPoint === true;
  const canOpenParticipantRoster = sections?.canOpenParticipantRoster === true;

  const venueLabel =
    model.registryPlaceName?.trim() ||
    model.activity.location?.name?.trim() ||
    '';
  const registryPath = model.registryPlacePath ?? activityRegistryPlacePath(model.activity);
  const activityGeoHero = useMemo(
    () => resolveActivityDetailGeoHero(model.activity),
    [model.activity]
  );
  const geoLinks = useGeoAncestorLinks({
    region: activityGeoHero.region,
    geoRef: activityGeoHero.geoRef,
  });
  const headerChrome = resolveActivityDetailHeaderChrome(model.activity, null);
  const areaLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, headerChrome.label);
  }, [headerChrome.label, location.pathname, location.search]);
  const activityGeoLine = (
    <ConsumerDetailHeroGeoLine
      geoLinks={geoLinks}
      regionFallback={activityGeoHero.region}
      placeHubLabel={activityGeoHero.placeHubLabel}
      destinationSlug={activityGeoHero.destinationSlug}
      geoHubPath={activityGeoHero.geoHubPath}
      areaLinkState={areaLinkState}
      geoLinkBackLabel={headerChrome.label}
      tone="onLight"
    />
  );
  const hasLinkedPlaceCard = Boolean(
    model.activity.location?.name?.trim() && registryPath
  );
  const isRideshare = model.activity.activityType === 'rideshare';
  const linkedParentSummary = resolveActivityLinkedParentSummary(model.activity);
  const linkedRideshareSummary = resolveActivityLinkedRideshareSummary(model.activity);
  const showLeadVenue = shouldShowActivityDetailLeadVenue(
    model.activityTitle,
    venueLabel,
    hasLinkedPlaceCard
  );
  const venueLine = showLeadVenue && !isRideshare ? (
    <ActivityDetailVenueLead
      activity={model.activity}
      activityTitle={model.activityTitle}
      venueLabel={venueLabel}
      placePath={registryPath}
    />
  ) : null;

  const showParticipantsRow = participantSlot !== 'hidden' && !hostManageSurface?.tenantId;

  const rosterPreview =
    model.rosterParticipants.length > 0
      ? model.rosterParticipants
      : (model.activity.participantPreviews ?? []).map((row) => ({
          id: row.id,
          name: row.name ?? 'Member',
          avatar: row.avatar ?? null,
        }));

  const isHostViewer = viewerIsActivityHostUser(model.activity, user?.id);
  const rideHostTenantId =
    isHostViewer ? model.linkRideshareTenantId ?? model.activity.tenantId ?? null : null;

  const hostAndSocialBlock = (
      <div className="grid gap-4 md:grid-cols-2 lg:gap-3">
        {showHostProfile ? (
          <div className="min-w-0">
            <ActivityGuideInviteBanner activity={model.activity} />
            <ActivityDetailHostRow
              activity={model.activity}
              hostPath={model.hostPath}
              canOpenHostProfile={model.canOpenHostProfile}
              showTenantRating={Boolean(model.activity.tenantId)}
            />
          </div>
        ) : null}
        {showParticipantsRow ? (
          <ActivityDetailSocialRow
            activity={model.activity}
            rosterParticipants={
              participantSlot === 'roster' ? model.rosterParticipants : rosterPreview
            }
            friendUserIdsOnActivity={
              model.viewerAccess?.entitlements?.friendUserIdsOnActivity ?? []
            }
            crewPath={
              isHostViewer || canOpenParticipantRoster ? activityCrewPath(model.activity.id) : null
            }
            pendingReviewCount={
              isHostViewer ? (model.hostCrewHub?.joinRequests.length ?? 0) : 0
            }
          />
        ) : null}
      </div>
    );

  return (
    <div className="w-full pt-1 pb-2" data-activity-scroll-detail-template>
      <ActivityDetailLead
        activity={model.activity}
        title={model.activityTitle}
        card={model.peekParityCard}
        geoLine={activityGeoLine}
        venueLine={venueLine}
        statusChips={model.consumerStatusChips}
      />

      {hostManageSurface?.tenantId ? (
        <div className="mt-3 space-y-3 lg:space-y-2.5">
          <ConsumerDetailHostParticipantsSection
            activity={hostManageSurface.activity}
            tenantId={hostManageSurface.tenantId}
            caps={hostManageSurface.caps}
            joinRequests={hostManageSurface.joinRequests}
            requestsLoading={hostManageSurface.requestsLoading}
            busyRequestId={hostManageSurface.busyRequestId}
            onParticipantsError={hostManageSurface.onParticipantsError}
            onApproveJoinRequest={hostManageSurface.onApproveJoinRequest}
            onRejectJoinRequest={hostManageSurface.onRejectJoinRequest}
          />
          <ConsumerDetailHostManageSection {...hostManageSurface} activity={model.activity} />
        </div>
      ) : null}

      {isRideshare ? (
        <ActivityDetailRideshareLinkage
          activity={model.activity}
          isRideHost={isHostViewer}
          hostTenantId={rideHostTenantId}
          onParentLinked={onRideshareParentLinked}
        />
      ) : linkedRideshareSummary ? (
        <section className="mt-2" aria-label="Linked rideshare">
          <ActivityLinkedRideshareAffordance rideshare={linkedRideshareSummary} className="mt-0" />
        </section>
      ) : !model.requiresSignIn ? (
        <ActivityDetailOfferRideshare
          activity={model.activity}
          viewerAccess={model.viewerAccess}
          tenantId={model.linkRideshareTenantId ?? model.activity.tenantId ?? null}
          onCreateRideshare={model.onOfferLinkedRideshare}
          onRideshareLinked={onRideshareParentLinked}
        />
      ) : null}

      {model.requiresSignIn ? (
        <div className="mt-3">
          <ActivityDetailGuestGate activity={model.activity} compact />
        </div>
      ) : null}

      {!isRideshare ? hostAndSocialBlock : null}

      <div className="mt-3 flex flex-col gap-6 lg:mt-2 lg:gap-3">
        {isRideshare ? (
          <ActivityDetailRideshareEssentials
            activity={model.activity}
            showVehiclePlate={model.viewerAccess?.canAccessCrewSurfaces === true}
          />
        ) : null}
        <div className="grid gap-6 md:grid-cols-2 lg:gap-3">
          <ActivityDetailPlaceCard
            activity={model.activity}
            hideForLinkedRideshare={isRideshare && Boolean(linkedParentSummary)}
          />
          <ActivityDetailGettingThere
            activity={model.activity}
            viewerAccess={model.viewerAccess}
            wireStrips={model.wireStrips}
            showMeetingPoint={showMeetingPoint}
            accessLat={model.accessLat}
            accessLng={model.accessLng}
            hasAccessCoordinates={model.hasAccessCoordinates}
            linkedTransportShownAbove={
              (isRideshare && Boolean(linkedParentSummary)) ||
              (!isRideshare && Boolean(linkedRideshareSummary))
            }
          />
        </div>
        {isRideshare ? hostAndSocialBlock : null}
        <ActivityDetailPacking activity={model.activity} />
        <ActivityDetailInstructions activity={model.activity} />
        <ActivityDetailPlanColumn model={model} planSections={planSections} factsOnly />
        <ActivityHostReviewSection
          activity={model.activity}
          canWriteReview={Boolean(model.canWriteActivityReview)}
        />
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

const ActivityDetailAudienceBadges = ({ badges }: { badges: string[] }) => {
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

const ActivityDetailLead = ({
  activity,
  title,
  card,
  geoLine,
  venueLine,
  statusChips,
}: {
  activity: ActivityDetailDTO;
  title: string;
  card: DiscoveryCardModel | null;
  geoLine: ReactNode;
  venueLine: ReactNode;
  statusChips: ActivityDetailHeroStatusChip[];
}) => {
  const leadDate = formatActivityDetailLeadDate(activity.date, activity.time);
  const scheduleSpan =
    activity.activityType !== 'rideshare' && activity.date
      ? activityScheduleSpanLabel(activity.date, activity.endDate)
      : null;
  const scheduleTimeStart = formatExploreTime(activity.time);
  const scheduleTimeEnd = formatExploreTime(activity.endTime);
  const scheduleTimeRange =
    scheduleTimeStart && scheduleTimeEnd && scheduleTimeEnd !== scheduleTimeStart
      ? `${scheduleTimeStart} – ${scheduleTimeEnd}`
      : scheduleTimeStart;
  const audienceBadges = resolveActivityDetailAudienceBadges(activity.requirements);
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
    Boolean(scheduleTimeRange && !isRideshareLead) ||
    Boolean(scheduleSpan && !isRideshareLead) ||
    Boolean(priceBadge) ||
    Boolean(participationChip) ||
    Boolean(rideshareSeats) ||
    audienceBadges.length > 0;

  return (
    <div className="pb-4 lg:border-b lg:border-neutral-200/80 lg:pb-3">
      {geoLine ? <div className="mb-1.5">{geoLine}</div> : null}
      <div className="flex items-start gap-3 lg:gap-3">
        <h1 className="min-w-0 flex-1 text-[1.5rem] font-bold leading-[1.15] tracking-tight text-neutral-950 md:text-[1.75rem] lg:text-[1.375rem] lg:leading-tight lg:tracking-tight">
          {title}
        </h1>
        <ActivityDetailLeadDateChip leadDate={leadDate} />
      </div>

      {showMetaRow ? (
        <div
          className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5"
          aria-label="Schedule, price, and who this outing is for"
        >
          {scheduleTimeRange && !isRideshareLead ? (
            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
              {scheduleTimeRange}
            </span>
          ) : null}
          {scheduleSpan && !isRideshareLead ? (
            <span className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
              {scheduleSpan}
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
          <ActivityDetailAudienceBadges badges={audienceBadges} />
        </div>
      ) : null}

      {venueLine ? <div className="mt-2">{venueLine}</div> : null}
    </div>
  );
};

const ActivityDetailVenueLead = ({
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
  const venueEyebrow = resolveActivityDetailVenueEyebrow(activity, placePath);
  const venueKindLabel = resolveActivityDetailVenueKindLabel(activity, placePath);
  const outingPath = activityDetailPath(activity.id);
  const linkedParent = activity.linkedParentActivity;
  const isRideshare = activity.activityType === 'rideshare';

  const linkedParentRow =
    linkedParent && !isRideshare ? (
      <ActivityLinkedParentPlanAffordance parent={linkedParent} className="mt-0" />
    ) : null;

  const outingRow =
    isRideshare && linkedParent ? null : (
      <div className="lg:hidden">
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
      <p
        className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold tracking-wide text-emerald-800/80"
        aria-label={venueEyebrow}
      >
        <span>{venueKindLabel} on</span>
        <UaeTrailBrandMark
          size="inline"
          wordmark={SITE_TITLE_BRAND}
          className="translate-y-px [&_span:last-child]:text-emerald-950"
        />
      </p>
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
    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-3 py-2.5 space-y-0 lg:inline-flex lg:max-w-full lg:flex-wrap lg:items-baseline lg:gap-x-3 lg:rounded-lg lg:border-neutral-200/80 lg:bg-neutral-50 lg:px-2.5 lg:py-1.5">
      {linkedParentRow}
      {outingRow}
      {venueRow}
    </div>
  );
};

const ActivityDetailSocialRow = ({
  activity,
  rosterParticipants,
  friendUserIdsOnActivity = [],
  crewPath = null,
  pendingReviewCount = 0,
}: {
  activity: ActivityDetailDTO;
  rosterParticipants: NonNullable<ActivityDetailDTO['participants']>;
  friendUserIdsOnActivity?: string[];
  crewPath?: string | null;
  pendingReviewCount?: number;
}) => {
  const countLabel = activityDetailParticipantCountLabel(activity);
  const friendsGoingLabel = activityDetailFriendsGoingLabel(friendUserIdsOnActivity);
  const pendingLabel =
    pendingReviewCount > 0 ? activityCrewPendingReviewLabel(pendingReviewCount) : null;
  const rosterAriaLabel = [countLabel, friendsGoingLabel, pendingLabel, "view who's going"]
    .filter(Boolean)
    .join(', ');
  const row = (
    <>
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
        {pendingLabel ? (
          <span className="text-xs font-semibold text-amber-800">{pendingLabel}</span>
        ) : null}
      </div>
    </>
  );

  return (
    <section aria-label="Going">
      <p className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>Going</p>
      <div className={`flex items-center gap-3 ${DETAIL_SCROLL_PANEL.social}`}>
        {crewPath ? (
          <Link
            to={crewPath}
            className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-90"
            aria-label={rosterAriaLabel}
          >
            {row}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{row}</div>
        )}
      </div>
    </section>
  );
};

type ActivityDetailPanelTone = 'logistics' | 'prep';

const ActivityDetailOpenSection = ({
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
  tone?: ActivityDetailPanelTone;
}) => (
  <section id={id} className="scroll-mt-24 lg:scroll-mt-12">
    <div className="mb-2.5 flex items-center gap-2 lg:mb-1.5">
      {icon}
      <h2 className={DETAIL_SCROLL_SECTION_TITLE}>{title}</h2>
    </div>
    <div
      className={`text-sm leading-relaxed text-neutral-800 lg:text-[13px] lg:leading-snug ${
        tone === 'prep' ? DETAIL_SCROLL_PANEL.prep : DETAIL_SCROLL_PANEL.logistics
      }`}
    >
      {children}
    </div>
  </section>
);

const ActivityDetailPacking = ({ activity }: { activity: ActivityDetailDTO }) => {
  if (!hasPackingList(activity.requirements)) return null;
  return (
    <ActivityDetailOpenSection id="activity-detail-packing" title="What to bring" tone="prep">
      <ActivityPackingListPreview
        requirements={activity.requirements}
        showTitle={false}
        className="border-0 bg-transparent p-0"
      />
    </ActivityDetailOpenSection>
  );
};

const ActivityDetailInstructions = ({ activity }: { activity: ActivityDetailDTO }) => {
  const lines = resolveActivityDetailRequirementLines(activity.requirements);
  if (lines.length === 0) return null;
  return (
    <ActivityDetailOpenSection id="activity-detail-instructions" title="Instructions" tone="prep">
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-emerald-600" aria-hidden>•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </ActivityDetailOpenSection>
  );
};

const ActivityDetailGettingThere = ({
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
    <ActivityDetailOpenSection
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
    </ActivityDetailOpenSection>
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

const ActivityDetailPlaceCard = ({
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
      <p className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>Where</p>
    <Link
      to={placePath}
      state={activityPlaceReturnState(activityDetailPath(activity.id))}
      className={DETAIL_SCROLL_PANEL.place}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 shadow-inner lg:h-9 lg:w-9 lg:rounded-lg">
        <MapPin className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">{kindLabel}</p>
        <p className="truncate text-[15px] font-semibold text-neutral-950 lg:text-[13px]">{name}</p>
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

const ActivityDetailHostRow = ({
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
  const publisher = activityPublisherFromDetail(activity);
  const tenant = showTenantBrand(activity) ? activity.tenantName : null;
  const tenantId = activity.tenantId?.trim() || null;
  const ratingVariant = activity.activityType === 'rideshare' ? 'driver' : 'host';
  const sectionLabel = publisher.kind === 'company' ? 'Operator' : 'Host';
  const inner = (
    <>
      <SecureAvatar
        src={publisher.avatarUrl ?? activityHostAvatar(activity)}
        name={publisher.name}
        className="h-10 w-10 shrink-0 text-sm ring-2 ring-white lg:h-8 lg:w-8 lg:text-xs"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500">
          {publisher.kind === 'company' ? 'Tour operator' : 'Hosted by'}
        </p>
        <p className="truncate text-[15px] font-semibold text-neutral-950 lg:text-[13px]">{publisher.name}</p>
        {tenant && publisher.kind !== 'company' ? (
          <p className="truncate text-sm text-neutral-600">{tenant}</p>
        ) : null}
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

  const shell = `flex items-center gap-3 ${DETAIL_SCROLL_PANEL.trust} active:opacity-95`;

  return (
    <section aria-label={sectionLabel}>
      <p className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>{sectionLabel}</p>
      {canOpenHostProfile && hostPath ? (
        <Link to={hostPath} className={shell}>{inner}</Link>
      ) : (
        <div className={shell}>{inner}</div>
      )}
      <ActivityGuidesList activity={activity} compact />
    </section>
  );
};
