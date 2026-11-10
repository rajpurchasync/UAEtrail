/**
 * Standard public `/activity/:id` layout (L3 consumer template).
 *
 * Detail revamp: hero cover + key facts strip, section jump row, main column + sticky join/actions on large screens.
 * Mobile: primary actions stay in the shell footer; desktop: sticky aside + footer hidden (`ActivityDetailView`).
 *
 * Route loader: `pages/ActivityDetail.tsx` · Shell: `ActivityDetailPageShell` · Chrome: `ActivityDetailView`.
 */
import { forwardRef, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { consumerDetailChildLinkState } from '../../../explore/mapPeekDetailNavState';
import { ChevronRight, Clock, CloudSun, MapPin, Car } from 'lucide-react';
import {
  filterMigratedPlaceholderGear,
  hasPackingList,
  resolveMapPinEmoji,
  buildActivitySpotsLeftLabel,
  type ActivityDetailDTO,
  type ActivityEngagementStripsDTO,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { extractJoinInstructionLines } from '../../../utils/joinInstructions';
import { extractActivityPlanDetailLines } from '../../../activity/activityDetailReachBy';
import type { useActivityDetailViewModel } from '../../../components/activity/detail/useActivityDetailViewModel';
import { ActivityDetailGuestGate } from '../../../components/activity/detail/ActivityDetailGuestGate';
import { ActivityDetailParticipantsRosterDialog } from '../../../components/activity/detail/ActivityDetailParticipantsRosterDialog';
import { activityDetailParticipantCountLabel } from '../../../components/activity/detail/activityDetailParticipantCountLabel';
import { formatActivityDetailConsumerLeadDate } from '../../../activity/formatActivityDetailConsumerLead';
import { ConsumerDetailLeadDateChip } from '../../../activity/detail/ConsumerDetailLeadDateChip';
import { resolveActivityConsumerRequirementLines } from '../../../activity/activityDetailConsumerRequirements';
import { ActivityPackingListPreview } from '../../../components/activity/ActivityPackingListPreview';
import { resolveActivityDetailConsumerAudienceBadges } from '../../../activity/activityDetailConsumerAudienceBadges';
import { shouldShowConsumerDetailHeroVenue } from '../../../activity/activityConsumerDetailLeadVenue';
import {
  ACTIVITY_DETAIL_LINKED_RIDESHARE_LABEL,
  ACTIVITY_DETAIL_LINKED_RIDES_JUMP_LABEL,
  ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID,
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
  resolveConsumerDetailVenueEyebrow,
  resolveConsumerDetailVenueKindLabel,
} from '../../../activity/resolveConsumerDetailVenueEyebrow';
import { UaeTrailBrandMark } from '../../../components/layout/UaeTrailBrandMark';
import { SITE_TITLE_BRAND } from '../../../config/seo';
import { ConsumerDetailRideshareLinkage } from './ConsumerDetailRideshareLinkage';
import {
  ConsumerDetailOfferRideshare,
  consumerDetailOfferRideshareVisible,
} from './ConsumerDetailOfferRideshare';
import { ConsumerDetailRideshareEssentials } from './ConsumerDetailRideshareEssentials';
import { ConsumerDetailDriverReviews } from './ConsumerDetailDriverReviews';
import { TenantHostRatingInline } from '../../../components/reviews/TenantHostRatingInline';
import { resolveRideshareSeatsAvailability } from '../../resolveRideshareSeatsAvailability';
import { ridesharePlanFactsHasContent, resolveRidesharePlanFacts } from '../activityKindRequirementFacts';
import { rideshareCardCoversDirections } from '../../rideshareCardDirections';
import { viewerIsActivityHostUser } from '../../../utils/viewerHostsActivity';
import type { ActivityDetailPlanSectionsComponent } from '../composers';
import { ActivityDetailPlanColumn } from '../../../components/activity/detail/ActivityDetailPlanColumn';
import { activityShowsCostPolicySection } from '../../../components/activity/detail/ActivityDetailCostPolicySection';
import { ActivityDetailSafetySection } from '../../../components/activity/detail/ActivityDetailSafetySection';
import { ReviewSection } from '../../../components/ui/ReviewSection';
import { activityScheduleHasEnded } from '@uaetrail/shared-types';
import { activityHasAudiencePresentation } from '../../../activity/activityDetailAudiencePresentation';
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
import { activityHostAvatar, showTenantBrand } from '../../../utils/hostLabels';
import { ActivityGuidesList } from '../../../activity/ActivityGuidesList';
import {
  activityPublisherFromDetail,
  shouldListActivityGuidesOnDetail,
} from '../../../activity/activityPublisherDisplay';
import { ActivityGuideInviteBanner } from '../../../activity/ActivityGuideInviteBanner';
import { activityKindChromeLabel } from '../../../activity/activityKindChrome';
import { resolveActivityConsumerDetailHeaderChrome } from '../../../activity/activityConsumerDetailHeader';
import { ConsumerDetailHeaderTypeMark } from '../../../components/mobile/ConsumerDetailHeaderChromeTitle';
import type { ConsumerDetailHeaderMark } from '../../../components/mobile/ConsumerDetailHeaderChromeTitle';
import { DirectionsControl, ParticipantPreview, SecureAvatar } from '../../../components/ui';
import { ConsumerWeatherMultiDayBlock } from '../../../detail/weather/ConsumerWeatherMultiDayBlock';
import {
  activityForecastIsoDates,
  readActivityForecastIsoDate,
} from '../../../detail/weather/activityForecastDates';
import { useActivePlatformAlerts } from '../../../hooks/useActivePlatformAlerts';
import { ConsumerDetailPlatformAlertBanner } from '../../../detail/ConsumerDetailPlatformAlertBanner';
import {
  DetailPageShell,
  HeroBanner,
  StatGrid,
  StatTile,
  ConsumerDetailSectionJumpNav,
  type ConsumerDetailJumpLink,
} from '../../../detail/shell';
import { LazyMeetingPointMap } from '../../../detail/shared/LazyMeetingPointMap';
import { resolveActivityDetailDirectionsCoords } from '../activityDetailDirectionsCoords';
import { DetailHeroPhotoStrip } from '../../../detail/shared/DetailHeroPhotoStrip';
import { DETAIL_HERO_MODAL_UNDERLAP_CLASS } from '../../../detail/shared/detailHeroMobileTopChrome';
import { ConsumerDetailHeroGeoLine } from '../../../detail/shared/ConsumerDetailHeroGeoLine';
import {
  CONSUMER_DETAIL_DETAILS_LABEL,
  CONSUMER_DETAIL_KEY_FACTS_LABEL,
  CONSUMER_DETAIL_OVERVIEW_LABEL,
} from '../../../content/consumerDetailSectionLabels';
import { renderKeyFactIcon } from '../../../detail/shell/keyFactIcons';
import { resolveActivityDetailAreaHero } from '../../../detail/shared/resolveConsumerDetailAreaHero';
import { collectActivityDetailHeroPhotos } from '../../../detail/shared/collectActivityDetailHeroPhotos';
import { useGeoAncestorLinks } from '../../../hooks/useGeoAncestorLinks';
import { resolveActivityDetailKind } from '../activityDetailKind';
import {
  ACTIVITY_CONSUMER_SECTION_ORDER,
  type ActivityConsumerSectionId,
} from '../composers/activityConsumerSectionOrder';
import { formatDate } from '../../../utils';
import {
  activityPriceLabel,
  inferActivityPricingMode,
} from '../../../utils/activityPricing';
import { ConsumerDetailSection } from '../../../detail/shell/ConsumerDetailSection';
import {
  ConsumerDetailHostManageSection,
  type ActivityHostManageSurfaceProps,
} from '../../../components/activity/ConsumerDetailHostManageSection';
import { ConsumerDetailHostParticipantsSection } from '../../../components/activity/ConsumerDetailHostParticipantsSection';
import {
  consumerDetailLogisticsTone,
  consumerDetailPrepTone,
} from '../../../detail/shell/consumerDetailSectionTones';
import { CONSUMER_DETAIL_PANEL } from './activityConsumerDetailSectionStyles';
type ActivityDetailViewModel = ReturnType<typeof useActivityDetailViewModel>;

export type ActivityConsumerDetailPageProps = {
  model: ActivityDetailViewModel;
  planSections?: ActivityDetailPlanSectionsComponent | null;
  onRideshareParentLinked?: () => void;
  heroTopAction?: ReactNode;
  hostManageSurface?: ActivityHostManageSurfaceProps | null;
};

export const ActivityConsumerDetailPage = ({
  model,
  planSections = null,
  onRideshareParentLinked,
  heroTopAction = null,
  hostManageSurface = null,
}: ActivityConsumerDetailPageProps) => {
  const { user } = useAuth();

  const layout = useMemo(
    () =>
      model.consumerLayout ?? {
        showPublishedCatalog: true,
        showHostProfile: true,
        participants: 'preview' as const,
        showMeetingPoint: true,
        showTransportSection: true,
        showHostManageHub: false,
        canOpenParticipantRoster: false,
      },
    [model.consumerLayout]
  );

  const venueLabel =
    model.registryPlaceName?.trim() || model.activity.locationName?.trim() || '';
  const registryPath = model.registryPlacePath ?? activityRegistryPlacePath(model.activity);
  const isRideshare = model.activity.activityType === 'rideshare';
  const linkedParentSummary = resolveActivityLinkedParentSummary(model.activity);
  const linkedRideshareSummary = resolveActivityLinkedRideshareSummary(model.activity);
  const showLinkedRidesJump =
    isRideshare ||
    Boolean(linkedRideshareSummary) ||
    (!model.requiresSignIn &&
      consumerDetailOfferRideshareVisible({
        activity: model.activity,
        viewerAccess: model.viewerAccess,
        tenantId: model.linkRideshareTenantId ?? model.activity.tenantId ?? null,
        onCreateRideshare: model.onOfferLinkedRideshare,
      }));
  const venueLine = shouldShowConsumerDetailHeroVenue(venueLabel, registryPath, isRideshare) ? (
    <ConsumerDetailVenueLead
      activity={model.activity}
      activityTitle={model.activityTitle}
      venueLabel={venueLabel}
      placePath={registryPath}
      variant="hero"
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

  const isActivityHostViewer = viewerIsActivityHostUser(model.activity, user?.id);
  const isRideHost = isActivityHostViewer;
  const rideHostTenantId =
    isRideHost ? model.linkRideshareTenantId ?? model.activity.tenantId ?? null : null;

  const hostAndSocialBlock = showParticipantsRow ? (
    <ConsumerDetailSocialRow
      key="host"
      activity={model.activity}
      participants={model.participants}
      rosterParticipants={
        layout.participants === 'roster' ? model.rosterParticipants : rosterPreview
      }
      buddyUserIdsOnActivity={model.viewerAccess?.entitlements?.buddyUserIdsOnActivity ?? []}
      canOpenFullRoster={layout.canOpenParticipantRoster}
    />
  ) : null;

  const showWhereCard = !(
    isRideshare && Boolean(linkedParentSummary)
  );
  const activity = model.activity;
  const forecastCoords = useMemo(() => resolveActivityForecastCoordinates(activity), [activity]);
  const forecastLat = forecastCoords?.lat ?? null;
  const forecastLng = forecastCoords?.lng ?? null;
  const detailsJumpHref = resolveConsumerDetailDetailsJumpHref(model.activity);
  const linkedTransportShownAbove =
    (isRideshare && Boolean(linkedParentSummary)) ||
    (!isRideshare && Boolean(linkedRideshareSummary));

  const consumerDetailJumpLinks = useMemo(
    () =>
      buildActivityConsumerDetailJumpLinks({
        activity: model.activity,
        card: model.peekParityCard,
        statusChips: model.consumerStatusChips,
        layout,
        showParticipantsRow,
        showLinkedRidesJump,
        showWhereCard,
        detailsJumpHref,
        viewerAccess: model.viewerAccess,
        wireStrips: model.wireStrips,
        showMeetingPoint: layout.showMeetingPoint,
        accessLat: model.accessLat,
        accessLng: model.accessLng,
        hasAccessCoordinates: model.hasAccessCoordinates,
        linkedTransportShownAbove,
        forecastCoords,
        isRideshare,
        hostManageSurface: Boolean(hostManageSurface),
      }),
    [
      model.activity,
      model.peekParityCard,
      model.consumerStatusChips,
      model.viewerAccess,
      model.wireStrips,
      model.accessLat,
      model.accessLng,
      model.hasAccessCoordinates,
      layout,
      showParticipantsRow,
      showLinkedRidesJump,
      showWhereCard,
      detailsJumpHref,
      linkedTransportShownAbove,
      forecastCoords,
      isRideshare,
      hostManageSurface,
    ]
  );

  const alertRegion = activity.region?.trim() || null;
  const platformAlerts = useActivePlatformAlerts({
    enabled: Boolean(model.consumerDetailLayout && !model.isEmbedded),
    lat: forecastLat,
    lng: forecastLng,
    radiusKm: 120,
    region: alertRegion,
  });

  if (!model.consumerDetailLayout || model.isEmbedded) {
    return null;
  }

  const consumerActionAside =
    model.consumerEngagementActions && !model.previewMode ? model.consumerEngagementActions : null;

  const showKeyFactsStrip = consumerDetailKeyFactsHasContent(
    model.activity,
    model.peekParityCard,
    model.consumerStatusChips,
    true
  );
  const keyFactsHostStack =
    showKeyFactsStrip ||
    layout.showHostProfile ||
    hostManageSurface?.tenantId ? (
      <div className="space-y-3 lg:space-y-2.5">
        {showKeyFactsStrip ? (
          <ConsumerDetailKeyFactsStrip
            activity={model.activity}
            card={model.peekParityCard}
            statusChips={model.consumerStatusChips}
            omitScheduleFromStrip
          />
        ) : null}
        {hostManageSurface?.tenantId ? (
          <>
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
          </>
        ) : null}
        {layout.showHostProfile ? (
          <ConsumerDetailHostSection
            activity={model.activity}
            hostPath={model.hostPath}
            canOpenHostProfile={model.canOpenHostProfile}
            viewerIsHost={isActivityHostViewer}
          />
        ) : null}
      </div>
    ) : null;

  const whereBlock = showWhereCard ? (
    <div
      key="where"
      id="activity-detail-where-block"
      className="grid min-w-0 scroll-mt-28 grid-cols-1 gap-4 md:scroll-mt-32 lg:scroll-mt-8 lg:gap-3"
    >
      <ConsumerDetailPlaceCard
        activity={model.activity}
        hideForLinkedRideshare={isRideshare && Boolean(linkedParentSummary)}
      />
      <ConsumerDetailGettingThere
        activity={model.activity}
        viewerAccess={model.viewerAccess}
        wireStrips={model.wireStrips}
        showMeetingPoint={layout.showMeetingPoint}
        accessLat={model.accessLat}
        accessLng={model.accessLng}
        hasAccessCoordinates={model.hasAccessCoordinates}
        linkedTransportShownAbove={linkedTransportShownAbove}
      />
    </div>
  ) : null;

  return (
    <div data-activity-consumer-detail-template>
      <DetailPageShell
        withModalChrome={false}
        hero={
          <ConsumerDetailHeroBanner
            activity={model.activity}
            title={model.activityTitle}
            heroImage={model.heroImage}
            heroImageFallback={model.heroImageFallback}
            card={model.peekParityCard}
            venueLine={venueLine}
            statusChips={model.consumerStatusChips}
            heroTopAction={heroTopAction}
            modalHeaderUnderlap={!hostManageSurface}
          />
        }
        alerts={
          <ConsumerDetailPlatformAlertBanner
            alerts={platformAlerts}
            label="Safety and conditions"
            className="mb-3 lg:mb-2"
          />
        }
        aboveJumpRow={
          model.requiresSignIn ? (
            <ActivityDetailGuestGate activity={model.activity} compact className="mb-4 lg:mb-3" />
          ) : null
        }
        jumpRow={
          model.requiresSignIn ? null : (
            <ConsumerDetailSectionJumpNav links={consumerDetailJumpLinks} />
          )
        }
        keyFacts={keyFactsHostStack}
        aside={
          <div className="space-y-4">
            {consumerActionAside && !hostManageSurface ? (
              <div className="[&_[data-activity-detail-standard-footer]]:flex-col [&_[data-activity-detail-standard-footer]]:overflow-visible [&_button]:w-full">
                {consumerActionAside}
              </div>
            ) : null}
            {!hostManageSurface ? (
              <ActivityDetailSafetySection
                activity={model.activity}
                panelClassName={model.mobilePlanPanel}
                showBaseline
                compact
                asideCard
                scrollAnchorId="activity-detail-safety"
                className="hidden md:block"
              />
            ) : null}
          </div>
        }
      >
        {model.requiresSignIn ? null : <ConsumerDetailOverviewBlock activity={model.activity} />}
        {!model.requiresSignIn
          ? ACTIVITY_CONSUMER_SECTION_ORDER[resolveActivityDetailKind(model.activity)].map((sectionId) => {
          const nodes: Record<ActivityConsumerSectionId, ReactNode> = {
            linkage: (() => {
              const inner = isRideshare ? (
                <ConsumerDetailRideshareLinkage
                  activity={model.activity}
                  isRideHost={isRideHost}
                  hostTenantId={rideHostTenantId}
                  onParentLinked={onRideshareParentLinked}
                />
              ) : linkedRideshareSummary ? (
                <ActivityLinkedRideshareAffordance rideshare={linkedRideshareSummary} className="mt-0" />
              ) : !model.requiresSignIn ? (
                <ConsumerDetailOfferRideshare
                  activity={model.activity}
                  viewerAccess={model.viewerAccess}
                  tenantId={model.linkRideshareTenantId ?? model.activity.tenantId ?? null}
                  onCreateRideshare={model.onOfferLinkedRideshare}
                  onRideshareLinked={onRideshareParentLinked}
                />
              ) : null;
              if (!inner) return null;
              return (
                <section
                  key="linkage"
                  id={ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID}
                  className="scroll-mt-28 md:scroll-mt-32 lg:scroll-mt-8"
                  aria-label={ACTIVITY_DETAIL_LINKED_RIDESHARE_LABEL}
                >
                  {inner}
                </section>
              );
            })(),
            guest: null,
            essentials: isRideshare ? (
              <ConsumerDetailRideshareEssentials
                key="essentials"
                activity={model.activity}
                showVehiclePlate={model.viewerAccess?.canAccessCrewSurfaces === true}
              />
            ) : null,
            where: whereBlock,
            host: hostAndSocialBlock,
            packing: (
              <ConsumerDetailPacking
                key="packing"
                activity={model.activity}
                isHostViewer={isRideHost}
              />
            ),
            instructions: <ConsumerDetailInstructions key="instructions" activity={model.activity} />,
            weather: <ConsumerDetailActivityWeather key="weather" activity={model.activity} />,
            details: (
              <ConsumerDetailActivityDetailsSection
                key="details"
                model={model}
                planSections={planSections}
              />
            ),
            plan: null,
            reviews:
              isRideshare && model.activity.tenantId ? (
                <ConsumerDetailDriverReviews key="reviews" tenantId={model.activity.tenantId} />
              ) : (
                <ConsumerDetailActivityReviews key="reviews" model={model} />
              ),
            safety: (
              <div key="safety" className={hostManageSurface ? undefined : 'md:hidden'}>
                <ActivityDetailSafetySection
                  activity={model.activity}
                  panelClassName={model.mobilePlanPanel}
                  showBaseline
                />
              </div>
            ),
          };
          return nodes[sectionId];
        })
          : null}
      </DetailPageShell>
    </div>
  );
};

// ——— Template sections (private to this file) ———

const CONSUMER_DETAIL_HERO_BADGE =
  'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-0 text-[11px] font-bold uppercase leading-none tracking-wide';

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

const ConsumerDetailAudienceBadges = ({
  badges,
  variant = 'default',
}: {
  badges: string[];
  variant?: 'default' | 'hero';
}) => {
  if (badges.length === 0) return null;
  const heroClass =
    variant === 'hero'
      ? 'border-white/35 bg-white/12 text-white backdrop-blur-sm'
      : '';
  return (
    <>
      {badges.map((badge) => (
        <span
          key={badge}
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${
            variant === 'hero' ? heroClass : audienceBadgeClass(badge)
          }`}
        >
          {badge}
        </span>
      ))}
    </>
  );
};

const resolveVenueHeaderMark = (
  activity: ActivityDetailDTO,
  placePath: string | null
): ConsumerDetailHeaderMark | undefined => {
  const loc = activity.location?.activityType;
  if (loc === 'hiking' || placePath?.includes('/trail/')) return 'trail';
  if (loc === 'camping' || placePath?.includes('/camp/')) return 'camping';
  if (activity.activityType === 'hiking') return 'hiking';
  if (activity.activityType === 'camping') return 'camping';
  return undefined;
};

const ConsumerDetailOverviewBlock = ({ activity }: { activity: ActivityDetailDTO }) => {
  const description = activity.description?.trim();
  if (!description) {
    return (
      <div
        id="activity-detail-about"
        className="scroll-mt-28 md:scroll-mt-32 lg:scroll-mt-8"
        aria-label={CONSUMER_DETAIL_OVERVIEW_LABEL}
      />
    );
  }

  return (
    <ConsumerDetailSection
      id="activity-detail-about"
      title={CONSUMER_DETAIL_OVERVIEW_LABEL}
      tone="emerald"
      ariaLabel={CONSUMER_DETAIL_OVERVIEW_LABEL}
      className="!mt-0"
      collapsible
      defaultExpanded
    >
      <p className="whitespace-pre-line leading-relaxed text-neutral-800 dark:text-neutral-100">
        {description}
      </p>
    </ConsumerDetailSection>
  );
};

const consumerHostSectionTitle = (activity: ActivityDetailDTO): string => {
  const publisher = activityPublisherFromDetail(activity);
  const hasGuides = shouldListActivityGuidesOnDetail(activity);
  if (publisher.kind === 'company') return hasGuides ? 'Operator & guides' : 'Operator';
  if (hasGuides) return 'Hosts';
  return 'Host';
};

const ConsumerDetailHostSection = ({
  activity,
  hostPath,
  canOpenHostProfile,
  viewerIsHost = false,
}: {
  activity: ActivityDetailDTO;
  hostPath: string | null;
  canOpenHostProfile: boolean;
  viewerIsHost?: boolean;
}) => {
  const sectionTitle = consumerHostSectionTitle(activity);
  return (
    <ConsumerDetailSection
      id="activity-detail-host"
      title={sectionTitle}
      tone="slate"
      ariaLabel={sectionTitle}
      collapsible
      defaultExpanded
      className="scroll-mt-28 md:scroll-mt-32 lg:scroll-mt-8"
    >
      <ActivityGuideInviteBanner activity={activity} />
      <ConsumerDetailHostRow
        activity={activity}
        hostPath={hostPath}
        canOpenHostProfile={canOpenHostProfile}
        showTenantRating={Boolean(activity.tenantId)}
        viewerIsHost={viewerIsHost}
        embedded
      />
    </ConsumerDetailSection>
  );
};

const ConsumerDetailHeroBanner = ({
  activity,
  title,
  heroImage,
  heroImageFallback,
  card,
  venueLine,
  statusChips,
  heroTopAction,
  modalHeaderUnderlap = true,
}: {
  activity: ActivityDetailDTO;
  title: string;
  heroImage: string;
  heroImageFallback: string;
  card: DiscoveryCardModel | null;
  venueLine: ReactNode;
  statusChips: ActivityDetailHeroStatusChip[];
  heroTopAction?: ReactNode;
  modalHeaderUnderlap?: boolean;
}) => {
  const location = useLocation();
  const headerChrome = resolveActivityConsumerDetailHeaderChrome(activity, card);
  const areaLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, headerChrome.label || 'Outing');
  }, [headerChrome.label, location.pathname, location.search]);
  const typeLabel = headerChrome.label || activityKindChromeLabel(activity.activityType);
  const leadDate = formatActivityDetailConsumerLeadDate(
    activity.date,
    activity.time,
    activity.endDate,
    activity.endTime
  );
  const isRideshareLead = activity.activityType === 'rideshare';
  const rideshareSeats = isRideshareLead ? resolveRideshareSeatsAvailability(activity) : null;
  const difficultyChip =
    card?.difficulty === 'easy' || card?.difficulty === 'moderate' || card?.difficulty === 'hard'
      ? `${card.difficulty.charAt(0).toUpperCase()}${card.difficulty.slice(1)}`
      : null;

  const heroStatusToneClass = (tone: ActivityDetailHeroStatusChip['tone']): string => {
    switch (tone) {
      case 'success':
        return 'border-emerald-300/60 bg-emerald-600/90 text-white';
      case 'warning':
        return 'border-amber-300/60 bg-amber-600/90 text-white';
      case 'muted':
        return 'border-white/25 bg-white/15 text-white/90';
      default:
        return 'border-white/30 bg-black/35 text-white';
    }
  };

  const heroPhotos = useMemo(() => collectActivityDetailHeroPhotos(activity), [activity]);
  const { region, areaLabel, areaSlug } = resolveActivityDetailAreaHero(activity);
  const geoLinks = useGeoAncestorLinks({
    region,
    countryCode: activity.countryCode ?? undefined,
  });
  const heroGeoLine =
    region || areaLabel ? (
      <ConsumerDetailHeroGeoLine
        geoLinks={geoLinks}
        regionFallback={region}
        areaLabel={areaLabel}
        areaSlug={areaSlug}
        areaLinkState={areaLinkState}
        geoLinkBackLabel={headerChrome.label || 'Outing'}
      />
    ) : null;

  const heroTimeChip =
    leadDate.time && !isRideshareLead ? (
      <span className="flex w-full min-w-0 items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
        <Clock className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        {leadDate.time}
      </span>
    ) : rideshareSeats ? (
      <span className="flex w-full min-w-0 items-center rounded-lg border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white">
        {rideshareSeats.label}
      </span>
    ) : null;

  const heroVenueLine = venueLine ? (
    <div className="min-w-0 max-w-full text-sm text-white/90 [&_a]:font-semibold [&_a]:text-white [&_a]:underline-offset-2 hover:[&_a]:underline">
      {venueLine}
    </div>
  ) : null;

  const heroOverlay = (
    <>
      <div className="flex w-full max-w-full flex-wrap items-center gap-1.5">
        <span
          className={`${CONSUMER_DETAIL_HERO_BADGE} border-white/35 bg-white/15 text-white`}
        >
          <ConsumerDetailHeaderTypeMark
            emoji={headerChrome.emoji}
            mark={headerChrome.mark}
            sizeClass="h-5 w-5 shrink-0"
            variant="hero"
          />
          <span>{typeLabel}</span>
        </span>
        {difficultyChip ? (
          <span className={`${CONSUMER_DETAIL_HERO_BADGE} border-white/30 bg-black/25 text-white`}>
            {difficultyChip}
          </span>
        ) : null}
        {statusChips.map((chip) => (
          <span
            key={chip.label}
            className={`${CONSUMER_DETAIL_HERO_BADGE} ${heroStatusToneClass(chip.tone)}`}
          >
            {chip.label}
          </span>
        ))}
      </div>
      <div className="flex w-fit max-w-full min-w-0 flex-col items-stretch gap-1.5 md:pe-2 lg:pe-1">
        <h1 className="line-clamp-2 min-w-0 text-left text-[1.55rem] font-bold leading-[1.2] tracking-tight md:text-[1.85rem] lg:text-[1.4rem]">
          {title}
        </h1>
        {heroVenueLine}
        {heroGeoLine}
        {heroTimeChip}
      </div>
    </>
  );

  if (heroPhotos.length > 0) {
    return (
      <div
        className={`-mx-4 mb-3 max-w-[calc(100%+2rem)] min-w-0 overflow-hidden md:-mx-6 md:max-w-[calc(100%+3rem)] md:mb-4 md:mt-0 md:pt-0 lg:mx-0 lg:mb-3 lg:max-w-full${
          modalHeaderUnderlap ? ` ${DETAIL_HERO_MODAL_UNDERLAP_CLASS}` : ''
        }`}
      >
        <DetailHeroPhotoStrip
          photos={heroPhotos}
          topEndAction={heroTopAction}
          bottomEndOverlay={<ConsumerDetailLeadDateChip leadDate={leadDate} />}
          selfDetailPath={activityDetailPath(activity.id)}
          showLinkedPhotoSourceLink={false}
          ariaLabel={`${title} photos`}
          overlay={heroOverlay}
          mobileOverlayLayout="centered"
        />
      </div>
    );
  }

  return (
    <HeroBanner
      imageUrl={heroImage}
      fallbackSrc={heroImageFallback}
      topEndAction={heroTopAction}
      typeBadge={
        <span
          className={`${CONSUMER_DETAIL_HERO_BADGE} border-white/35 bg-white/15 text-white`}
        >
          <ConsumerDetailHeaderTypeMark
            emoji={headerChrome.emoji}
            mark={headerChrome.mark}
            sizeClass="h-5 w-5 shrink-0"
            variant="hero"
          />
          <span>{typeLabel}</span>
        </span>
      }
      status={
        <>
          {difficultyChip ? (
            <span className={`${CONSUMER_DETAIL_HERO_BADGE} border-white/30 bg-black/25 text-white`}>
              {difficultyChip}
            </span>
          ) : null}
          {statusChips.map((chip) => (
            <span
              key={chip.label}
              className={`${CONSUMER_DETAIL_HERO_BADGE} ${heroStatusToneClass(chip.tone)}`}
            >
              {chip.label}
            </span>
          ))}
        </>
      }
      title={title}
      subtitle={
        heroVenueLine || heroGeoLine ? (
          <div className="mt-1.5 flex w-fit max-w-full flex-col items-stretch gap-1.5 text-white/90 [&_a]:font-semibold [&_a]:text-white [&_a]:underline-offset-2 hover:[&_a]:underline">
            {heroVenueLine}
            {heroGeoLine}
          </div>
        ) : null
      }
      chips={heroTimeChip}
      dateBlock={<ConsumerDetailLeadDateChip leadDate={leadDate} />}
      modalHeaderUnderlap={modalHeaderUnderlap}
    />
  );
};

const activityConsumerDetailHasPlanBody = (activity: ActivityDetailDTO): boolean => {
  if (activityShowsCostPolicySection(activity)) return true;
  if ((activity.itinerarySteps?.length ?? 0) > 0 || (activity.itinerary?.length ?? 0) > 0) return true;
  if (filterMigratedPlaceholderGear(activity.gear, activity.requirements).length > 0) return true;
  if (extractActivityPlanDetailLines(activity.requirements).length > 0) return true;
  if (extractJoinInstructionLines(activity.requirements).length > 0) return true;
  if (activityHasAudiencePresentation(activity)) return true;
  return false;
};

const ConsumerDetailActivityDetailsSection = ({
  model,
  planSections,
}: {
  model: ActivityDetailViewModel;
  planSections?: ActivityDetailPlanSectionsComponent | null;
}) => {
  const hasBody = activityConsumerDetailHasPlanBody(model.activity);

  return (
    <ConsumerDetailSection
      id="activity-detail-details"
      title="Details"
      tone="slate"
      ariaLabel="Details"
      collapsible
      defaultExpanded
    >
      {hasBody ? (
        <ActivityDetailPlanColumn
          model={model}
          planSections={planSections}
          consumerInline
        />
      ) : (
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          The host has not added itinerary, cost, or plan specifics yet. Message them from the actions
          panel if you need clarity before you join.
        </p>
      )}
    </ConsumerDetailSection>
  );
};

const resolveConsumerDetailDetailsJumpHref = (_activity: ActivityDetailDTO): string =>
  '#activity-detail-details';

const ACTIVITY_DETAIL_ESSENTIALS_SECTION_ID = 'activity-detail-essentials';

function consumerDetailKeyFactsHasContent(
  activity: ActivityDetailDTO,
  card: DiscoveryCardModel | null,
  statusChips: ActivityDetailHeroStatusChip[],
  omitScheduleFromStrip: boolean
): boolean {
  const place = activity.location;
  const statsLine =
    place && place.distance != null && place.distance > 0
      ? `${place.distance}`
      : null;
  const spots = activity.slotsTotal != null && activity.slotsTotal > 0;
  const priceValue = inferActivityPricingMode(activity) === 'free' ? 'Free' : activityPriceLabel(activity);
  const explorePrice = card?.source === 'activity' ? card.price : null;
  const priceBadge = explorePrice?.badge ?? null;
  const participationChip = participationStatusChip(statusChips);
  const audienceBadges = resolveActivityDetailConsumerAudienceBadges(activity.requirements);
  const hasChips = Boolean(priceBadge || participationChip || audienceBadges.length > 0);

  if (statsLine) return true;
  if (card?.venueDistanceKm != null && card.venueDistanceKm > 0 && !statsLine) return true;
  if (card?.venueElevationM != null && card.venueElevationM > 0 && !statsLine) return true;
  if (card?.venueDurationHours != null && card.venueDurationHours > 0) return true;
  if (spots) return true;
  if (priceValue) return true;
  if (!omitScheduleFromStrip && activity.date) return true;
  return hasChips;
}

function consumerDetailGettingThereHasContent(
  activity: ActivityDetailDTO,
  viewerAccess: ActivityViewerAccessDTO | null,
  wireStrips: ActivityEngagementStripsDTO | null | undefined,
  showMeetingPoint: boolean,
  accessLat: number | null,
  accessLng: number | null,
  hasAccessCoordinates: boolean,
  linkedTransportShownAbove: boolean
): boolean {
  const card = buildActivityDetailPageShellCard({ activity, viewerAccess, wireStrips });
  const accessibleBy = formatActivityAccessibleBySummary(activity.requirements);
  const reachLines = extractActivityTransportReachLines(activity.requirements);
  const peekLinkedTransport = activityPeekHasLinkedTransportAffordance(card);
  const showLinkedTransportInSection = peekLinkedTransport && !linkedTransportShownAbove;
  const showRideshareOpenOffer =
    Boolean(activity.rideshareEnabled) && !peekLinkedTransport && card.source === 'activity';
  const { lat: dirLat, lng: dirLng } = resolveActivityDetailDirectionsCoords(activity, accessLat, accessLng);
  const hasDirections = dirLat != null && dirLng != null;
  const directionsOnRideCard =
    hasDirections && rideshareCardCoversDirections(activity, dirLat as number, dirLng as number);
  const meetingLabel =
    activity.meetingPoint?.trim() ||
    activity.startPoint?.trim() ||
    activity.parkingPoint?.trim() ||
    null;
  const showMeetingBlock = showMeetingPoint && (Boolean(meetingLabel) || hasAccessCoordinates);

  return Boolean(
    accessibleBy ||
      reachLines.length > 0 ||
      showLinkedTransportInSection ||
      showRideshareOpenOffer ||
      (hasDirections && !directionsOnRideCard) ||
      showMeetingBlock
  );
}

function buildActivityConsumerDetailJumpLinks(input: {
  activity: ActivityDetailDTO;
  card: DiscoveryCardModel | null;
  statusChips: ActivityDetailHeroStatusChip[];
  layout: {
    showHostProfile: boolean;
    showMeetingPoint: boolean;
  };
  showParticipantsRow: boolean;
  showLinkedRidesJump: boolean;
  showWhereCard: boolean;
  detailsJumpHref: string;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips: ActivityEngagementStripsDTO | null | undefined;
  showMeetingPoint: boolean;
  accessLat: number | null;
  accessLng: number | null;
  hasAccessCoordinates: boolean;
  linkedTransportShownAbove: boolean;
  forecastCoords: { lat: number; lng: number } | null;
  isRideshare: boolean;
  hostManageSurface?: boolean;
}): ConsumerDetailJumpLink[] {
  const links: ConsumerDetailJumpLink[] = [];
  const push = (link: ConsumerDetailJumpLink) => {
    links.push(link);
  };

  if (
    consumerDetailKeyFactsHasContent(input.activity, input.card, input.statusChips, true)
  ) {
    push({
      href: '#activity-detail-key-facts',
      label: CONSUMER_DETAIL_KEY_FACTS_LABEL,
      sectionId: 'activity-detail-key-facts',
    });
  }

  if (input.hostManageSurface) {
    push({
      href: '#activity-detail-host-participants',
      label: 'Participants',
      sectionId: 'activity-detail-host-participants',
    });
    push({
      href: '#activity-detail-hosting',
      label: 'Hosting',
      sectionId: 'activity-detail-hosting',
    });
    push({
      href: '#activity-detail-about',
      label: CONSUMER_DETAIL_OVERVIEW_LABEL,
      sectionId: 'activity-detail-about',
    });
  } else {
    if (input.layout.showHostProfile) {
      push({ href: '#activity-detail-host', label: 'Host', sectionId: 'activity-detail-host' });
    }
    push({
      href: '#activity-detail-about',
      label: CONSUMER_DETAIL_OVERVIEW_LABEL,
      sectionId: 'activity-detail-about',
    });
  }

  if (input.showLinkedRidesJump) {
    push({
      href: `#${ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID}`,
      label: ACTIVITY_DETAIL_LINKED_RIDES_JUMP_LABEL,
      sectionId: ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID,
    });
  }

  if (
    input.isRideshare &&
    (ridesharePlanFactsHasContent(resolveRidesharePlanFacts(input.activity)) || Boolean(input.activity.date))
  ) {
    push({
      href: `#${ACTIVITY_DETAIL_ESSENTIALS_SECTION_ID}`,
      label: 'Ride share',
      sectionId: ACTIVITY_DETAIL_ESSENTIALS_SECTION_ID,
    });
  }

  if (input.showParticipantsRow && !input.hostManageSurface) {
    push({
      href: '#activity-detail-going',
      label: 'Going',
      sectionId: 'activity-detail-going',
    });
  }

  push({
    href: input.detailsJumpHref,
    label: CONSUMER_DETAIL_DETAILS_LABEL,
    sectionId: input.detailsJumpHref.replace(/^#/, ''),
  });

  if (input.showWhereCard) {
    push({
      href: '#activity-detail-where-block',
      label: 'Where',
      sectionId: 'activity-detail-where-block',
    });
    if (
      consumerDetailGettingThereHasContent(
        input.activity,
        input.viewerAccess,
        input.wireStrips,
        input.showMeetingPoint,
        input.accessLat,
        input.accessLng,
        input.hasAccessCoordinates,
        input.linkedTransportShownAbove
      )
    ) {
      push({
        href: '#activity-detail-getting-there',
        label: 'Getting there',
        sectionId: 'activity-detail-getting-there',
      });
    }
  }

  const gearItems = filterMigratedPlaceholderGear(input.activity.gear, input.activity.requirements);
  if (hasPackingList(input.activity.requirements) || gearItems.length > 0) {
    push({
      href: '#activity-detail-packing',
      label: 'What to bring',
      sectionId: 'activity-detail-packing',
    });
  }

  if (resolveActivityConsumerRequirementLines(input.activity.requirements).length > 0) {
    push({
      href: '#activity-detail-instructions',
      label: 'Instructions',
      sectionId: 'activity-detail-instructions',
    });
  }

  if (input.forecastCoords && readActivityForecastIsoDate(input.activity)) {
    push({
      href: '#activity-detail-weather',
      label: 'Weather',
      sectionId: 'activity-detail-weather',
    });
  }

  push({ href: '#reviews', label: 'Reviews', sectionId: 'reviews' });
  push({ href: '#activity-detail-safety', label: 'Safety', sectionId: 'activity-detail-safety' });

  return links;
}

const ConsumerDetailKeyFactsStrip = ({
  activity,
  card,
  statusChips,
  omitScheduleFromStrip = false,
}: {
  activity: ActivityDetailDTO;
  card: DiscoveryCardModel | null;
  statusChips: ActivityDetailHeroStatusChip[];
  /** Hero date chip + time overlay already show schedule. */
  omitScheduleFromStrip?: boolean;
}) => {
  const audienceBadges = resolveActivityDetailConsumerAudienceBadges(activity.requirements);
  const participationChip = participationStatusChip(statusChips);
  const explorePrice = card?.source === 'activity' ? card.price : null;
  const priceBadge = explorePrice?.badge ?? null;
  const place = activity.location;
  const statsLine =
    place && place.distance != null && place.distance > 0
      ? [
          `${place.distance} km`,
          place.elevation != null && place.elevation > 0 ? `${place.elevation} m` : null,
          place.difficulty ? capitalize(place.difficulty) : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : null;
  const spots = buildActivitySpotsLeftLabel(activity.slotsAvailable, activity.slotsTotal, {
    participantCount: activity.participants?.length,
    countsGoing: activity.counts?.going,
  });
  const pricingMode = inferActivityPricingMode(activity);
  const priceValue =
    pricingMode === 'free' ? 'Free' : activityPriceLabel(activity);

  type Fact = { icon: ReactNode; label: string; value: string; key: string };
  const facts: Fact[] = [];

  if (statsLine) {
    facts.push({
      key: 'trail',
      icon: renderKeyFactIcon('length'),
      label: place?.activityType === 'camping' ? 'Camp' : 'Trail',
      value: statsLine,
    });
  }
  if (card?.venueDistanceKm != null && card.venueDistanceKm > 0 && !statsLine) {
    facts.push({
      key: 'distance',
      icon: renderKeyFactIcon('distance'),
      label: 'Distance',
      value: `${card.venueDistanceKm} km`,
    });
  }
  if (card?.venueElevationM != null && card.venueElevationM > 0 && !statsLine) {
    facts.push({
      key: 'elev',
      icon: renderKeyFactIcon('elevation'),
      label: 'Elev.',
      value: `${card.venueElevationM} m`,
    });
  }
  if (card?.venueDurationHours != null && card.venueDurationHours > 0) {
    facts.push({
      key: 'duration',
      icon: renderKeyFactIcon('duration'),
      label: 'Duration',
      value: `${card.venueDurationHours} h`,
    });
  }
  if (spots) {
    facts.push({
      key: 'spots',
      icon: renderKeyFactIcon('spots'),
      label: 'Spots',
      value: spots,
    });
  }
  if (priceValue) {
    facts.push({
      key: 'price',
      icon: renderKeyFactIcon('price'),
      label: 'Price',
      value: priceValue,
    });
  }
  const scheduleLead = formatActivityDetailConsumerLeadDate(
    activity.date,
    activity.time,
    activity.endDate,
    activity.endTime
  );
  if (!omitScheduleFromStrip) {
    if (activity.date) {
      facts.push({
        key: 'date',
        icon: renderKeyFactIcon('date'),
        label: 'Date',
        value: scheduleLead.label || formatDate(activity.date),
      });
    }
    if (scheduleLead.time) {
      facts.push({
        key: 'time',
        icon: renderKeyFactIcon('time'),
        label: 'Time',
        value: scheduleLead.time,
      });
    }
  }

  const chipRows =
    priceBadge || participationChip || audienceBadges.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Price and who this outing is for">
        {priceBadge ? (
          <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-100">
            {priceBadge}
          </span>
        ) : null}
        {participationChip ? (
          <span className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
            {participationChip.label}
          </span>
        ) : null}
        <ConsumerDetailAudienceBadges badges={audienceBadges} variant="default" />
      </div>
    ) : null;

  if (!consumerDetailKeyFactsHasContent(activity, card, statusChips, omitScheduleFromStrip)) {
    return null;
  }

  return (
    <ConsumerDetailSection
      id="activity-detail-key-facts"
      title={CONSUMER_DETAIL_KEY_FACTS_LABEL}
      tone="neutral"
      ariaLabel={CONSUMER_DETAIL_KEY_FACTS_LABEL}
      bleedBody
      collapsible
      defaultExpanded
      className="!mt-0 overflow-visible"
    >
      <div className="space-y-2">
        {facts.length > 0 ? (
          <StatGrid label="">
            {facts.map((f) => (
              <StatTile key={f.key} icon={f.icon} label={f.label} value={f.value} />
            ))}
          </StatGrid>
        ) : null}
        {chipRows}
      </div>
    </ConsumerDetailSection>
  );
};

const ConsumerDetailVenueLead = ({
  activity,
  activityTitle,
  venueLabel,
  placePath,
  variant = 'card',
}: {
  activity: ActivityDetailDTO;
  activityTitle: string;
  venueLabel: string;
  placePath: string | null;
  variant?: 'card' | 'hero';
}) => {
  const venueEyebrow = resolveConsumerDetailVenueEyebrow(activity, placePath);
  const venueKindLabel = resolveConsumerDetailVenueKindLabel(activity, placePath);
  const venueMark = resolveVenueHeaderMark(activity, placePath);
  const venueEmoji = resolveMapPinEmoji(
    activity.location?.activityType ?? activity.activityType ?? 'hiking',
    'venue'
  );
  /** Hero venue chip — scheduled activity mark, not map place/spot pin. */
  const activityTypeChrome = resolveActivityConsumerDetailHeaderChrome(activity, null);
  const heroVenueTypeMark = (
    <ConsumerDetailHeaderTypeMark
      emoji={activityTypeChrome.emoji}
      mark={activityTypeChrome.mark}
      sizeClass="h-6 w-6"
      variant="hero"
    />
  );
  const hero = variant === 'hero';
  const outingPath = activityDetailPath(activity.id);
  const linkedParent = activity.linkedParentActivity;
  const isRideshare = activity.activityType === 'rideshare';

  const linkedParentRow =
    linkedParent && !isRideshare ? (
      <ActivityLinkedParentPlanAffordance parent={linkedParent} className="mt-0" />
    ) : null;

  const outingRow =
    hero || (isRideshare && linkedParent) ? null : (
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

  const heroVenueTextClass =
    'min-w-0 max-md:truncate md:line-clamp-2 md:whitespace-normal md:[overflow-wrap:anywhere]';

  if (hero && !linkedParentRow && !outingRow) {
    if (!venueLabel.trim()) return null;
    return placePath ? (
      <Link
        to={placePath}
        state={activityPlaceReturnState(outingPath)}
        className="inline-flex min-w-0 max-w-full items-start gap-2 text-sm font-semibold leading-snug text-white hover:underline md:items-center"
      >
        {heroVenueTypeMark}
        <span className={heroVenueTextClass}>{venueLabel}</span>
      </Link>
    ) : (
      <span className="inline-flex min-w-0 max-w-full items-start gap-2 text-sm font-medium leading-snug text-white/95 md:items-center">
        {heroVenueTypeMark}
        <span className={heroVenueTextClass}>{venueLabel}</span>
      </span>
    );
  }

  const venueRow = (
    <div
      className={
        linkedParentRow || outingRow
          ? hero
            ? 'mt-2 border-t border-white/20 pt-2'
            : 'mt-2.5 border-t border-emerald-200/50 pt-2.5'
          : ''
      }
    >
      {hero ? (
        placePath ? (
          <Link
            to={placePath}
            state={activityPlaceReturnState(outingPath)}
            className="inline-flex min-w-0 max-w-full items-start gap-2 text-sm font-semibold leading-snug text-white hover:underline md:items-center"
          >
            {heroVenueTypeMark}
            <span className={heroVenueTextClass}>{venueLabel}</span>
          </Link>
        ) : (
          <p className="inline-flex min-w-0 max-w-full items-start gap-2 text-sm font-medium leading-snug text-white/95 md:items-center">
            {heroVenueTypeMark}
            <span className={heroVenueTextClass}>{venueLabel}</span>
          </p>
        )
      ) : (
        <>
          <p
            className="flex min-w-0 items-center gap-2 text-[11px] font-bold tracking-wide text-emerald-800/80"
            aria-label={venueEyebrow}
          >
            <ConsumerDetailHeaderTypeMark
              emoji={venueEmoji}
              mark={venueMark}
              sizeClass="h-7 w-7"
              variant="default"
            />
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-1">
              <span>{venueKindLabel} on</span>
              <UaeTrailBrandMark
                size="inline"
                wordmark={SITE_TITLE_BRAND}
                className="translate-y-px [&_span:last-child]:text-emerald-950"
              />
            </span>
          </p>
          {placePath ? (
            <Link
              to={placePath}
              state={activityPlaceReturnState(outingPath)}
              className="mt-1 block text-sm font-semibold leading-snug text-emerald-900 hover:underline"
            >
              {venueLabel}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-medium leading-snug text-emerald-800">{venueLabel}</p>
          )}
          {placePath ? (
            <p className="mt-1 text-xs font-medium leading-snug text-emerald-800/90">
              {ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE}
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  const shellClass = hero
    ? 'pointer-events-auto min-w-0 w-fit max-w-[min(100%,16.5rem)] space-y-0 rounded-xl border border-white/25 bg-black/35 px-3 py-2 backdrop-blur-md md:w-full md:max-w-full'
    : 'space-y-0 rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-3 py-2.5 lg:inline-flex lg:max-w-full lg:flex-wrap lg:items-baseline lg:gap-x-3 lg:rounded-lg lg:border-neutral-200/80 lg:bg-neutral-50 lg:px-2.5 lg:py-1.5';

  return (
    <div className={shellClass}>
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
  const hasAnyoneGoing = rosterParticipants.length > 0;
  const rosterAriaLabel = [
    countLabel,
    friendsGoingLabel,
    "view who's going",
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <ConsumerDetailSection
      id="activity-detail-going"
      title="Going"
      tone="violet"
      ariaLabel="Going"
      collapsible
      defaultExpanded={hasAnyoneGoing}
    >
      <div className="flex items-center gap-3">
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
            <span className="text-sm font-medium tabular-nums text-neutral-500 dark:text-neutral-400">
              {countLabel}
            </span>
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
    </ConsumerDetailSection>
  );
};

type ConsumerDetailPanelTone = 'logistics' | 'prep';

const activityDetailSectionPageKey = (activityId: string) => `activity:${activityId}`;

const ConsumerDetailOpenSection = forwardRef<
  HTMLElement,
  {
    title: string;
    children: ReactNode;
    id?: string;
    icon?: ReactNode;
    tone?: ConsumerDetailPanelTone;
    pageKey: string;
  }
>(function ConsumerDetailOpenSection({ title, children, id, icon, tone = 'logistics', pageKey }, ref) {
  return (
    <ConsumerDetailSection
      ref={ref}
      id={id}
      title={title}
      tone={tone === 'prep' ? consumerDetailPrepTone : consumerDetailLogisticsTone}
      collapsible
      defaultExpanded
      pageKey={pageKey}
    >
      {icon ? <div className="mb-2 flex items-center gap-2">{icon}</div> : null}
      {children}
    </ConsumerDetailSection>
  );
});

const ConsumerDetailPacking = ({
  activity,
  isHostViewer = false,
}: {
  activity: ActivityDetailDTO;
  isHostViewer?: boolean;
}) => {
  const hasPacking = hasPackingList(activity.requirements);
  const gearItems = filterMigratedPlaceholderGear(activity.gear, activity.requirements);
  if (!hasPacking && gearItems.length === 0) return null;

  return (
    <ConsumerDetailOpenSection
      id="activity-detail-packing"
      title="What to bring"
      tone="prep"
      pageKey={activityDetailSectionPageKey(activity.id)}
    >
      {hasPacking ? (
        <ActivityPackingListPreview
          requirements={activity.requirements}
          showTitle={false}
          className="border-0 bg-transparent p-0"
          hideJoinerAcknowledgement={isHostViewer}
        />
      ) : null}
      {gearItems.length > 0 ? (
        <ul className={`space-y-2 ${hasPacking ? 'mt-3 border-t border-emerald-100/80 pt-3' : ''}`}>
          {gearItems.map((row) => (
            <li key={row.key} className="flex gap-2 text-sm text-neutral-800">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                {row.level === 'mandatory' ? 'Must have' : row.level}
              </span>
              <span>
                {row.label}
                {row.spec ? <span className="mt-0.5 block text-xs text-neutral-600">{row.spec}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </ConsumerDetailOpenSection>
  );
};

const ConsumerDetailInstructions = ({ activity }: { activity: ActivityDetailDTO }) => {
  const lines = resolveActivityConsumerRequirementLines(activity.requirements);
  if (lines.length === 0) return null;
  return (
    <ConsumerDetailOpenSection
      id="activity-detail-instructions"
      title="Instructions"
      tone="prep"
      pageKey={activityDetailSectionPageKey(activity.id)}
    >
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

const resolveActivityForecastCoordinates = (
  activity: ActivityDetailDTO
): { lat: number; lng: number } | null => {
  const lat =
    activity.displayLatitude ??
    activity.meetingLat ??
    activity.startLat ??
    activity.parkingLat ??
    activity.locationLatitude ??
    activity.location?.latitude ??
    null;
  const lng =
    activity.displayLongitude ??
    activity.meetingLng ??
    activity.startLng ??
    activity.parkingLng ??
    activity.locationLongitude ??
    activity.location?.longitude ??
    null;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

const ConsumerDetailActivityWeather = ({ activity }: { activity: ActivityDetailDTO }) => {
  const forecastDates = useMemo(() => activityForecastIsoDates(activity), [activity]);
  const coords = useMemo(() => resolveActivityForecastCoordinates(activity), [activity]);

  if (forecastDates.length === 0 || !coords) return null;

  return (
    <ConsumerDetailOpenSection
      id="activity-detail-weather"
      title="Weather"
      icon={<CloudSun className="h-4 w-4 shrink-0 text-sky-700" aria-hidden />}
      tone="logistics"
      pageKey={activityDetailSectionPageKey(activity.id)}
    >
      <ConsumerWeatherMultiDayBlock
        lat={coords.lat}
        lng={coords.lng}
        dates={forecastDates}
        variant="compact"
        forecastForName={
          activity.meetingPoint?.trim() ||
          activity.startPoint?.trim() ||
          'This area'
        }
      />
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
  const { lat: dirLat, lng: dirLng } = resolveActivityDetailDirectionsCoords(
    activity,
    accessLat,
    accessLng
  );
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
      id="activity-detail-getting-there"
      title="Getting there"
      icon={<Car className="h-4 w-4 text-sky-700/80" aria-hidden />}
      pageKey={activityDetailSectionPageKey(activity.id)}
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
          <>
            {showMeetingBlock ? (
              <LazyMeetingPointMap
                lat={dirLat as number}
                lng={dirLng as number}
                label={meetingLabel}
                hideExternalLink
                showStyleToggle
              />
            ) : null}
            <DirectionsControl
              lat={dirLat as number}
              lng={dirLng as number}
              variant="link"
              label="Get directions"
              showAppPickerAffordance={false}
              showLeadingIcon
              linkClassName="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 active:text-emerald-900"
            />
          </>
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
    <ConsumerDetailSection title="Where" tone="emerald" ariaLabel="Where" collapsible defaultExpanded>
    <Link
      to={placePath}
      state={activityPlaceReturnState(activityDetailPath(activity.id))}
      className={`${CONSUMER_DETAIL_PANEL.place} w-full min-w-0 border-0 shadow-none ring-0 max-lg:flex-col max-lg:items-stretch max-lg:gap-3 lg:flex-row lg:items-center`}
    >
      <div className="flex min-w-0 items-start gap-3 lg:items-center lg:gap-2.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900 shadow-inner lg:h-9 lg:w-9 lg:rounded-lg">
          <MapPin className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-emerald-950 dark:text-emerald-200 lg:text-[10px]">
            {kindLabel}
          </p>
          <p className="text-[15px] font-semibold leading-snug text-neutral-950 max-lg:line-clamp-2 lg:truncate lg:text-[13px]">
            {name}
          </p>
        </div>
        <ChevronRight
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700/50 lg:hidden"
          aria-hidden
        />
      </div>
      <div className="min-w-0 border-t border-emerald-100/90 pt-2.5 dark:border-emerald-900/40 lg:border-0 lg:pt-0">
        <p className="text-xs font-medium leading-snug text-emerald-800/90 dark:text-emerald-200/90">
          {ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE}
        </p>
        {stats ? (
          <p className="mt-1 text-sm leading-snug text-neutral-600 dark:text-neutral-300">{stats}</p>
        ) : null}
      </div>
      <ChevronRight
        className="hidden h-5 w-5 shrink-0 text-emerald-700/50 lg:block"
        aria-hidden
      />
    </Link>
    </ConsumerDetailSection>
  );
};

const ConsumerDetailHostRow = ({
  activity,
  hostPath,
  canOpenHostProfile,
  showTenantRating = false,
  embedded = false,
  viewerIsHost = false,
}: {
  activity: ActivityDetailDTO;
  hostPath: string | null;
  canOpenHostProfile: boolean;
  showTenantRating?: boolean;
  /** Nested under Overview — no second bordered section. */
  embedded?: boolean;
  /** Signed-in host viewing their own outing — show “You” instead of display name. */
  viewerIsHost?: boolean;
}) => {
  const publisher = activityPublisherFromDetail(activity);
  const tenant = showTenantBrand(activity) ? activity.tenantName : null;
  const tenantId = activity.tenantId?.trim() || null;
  const ratingVariant = activity.activityType === 'rideshare' ? 'driver' : 'host';
  const sectionLabel = publisher.kind === 'company' ? 'Operator' : 'Host';
  const hostDisplayName =
    viewerIsHost && publisher.kind !== 'company' ? 'You' : publisher.name;
  const inner = (
    <>
      <SecureAvatar
        src={publisher.avatarUrl ?? activityHostAvatar(activity)}
        name={hostDisplayName}
        className="h-10 w-10 shrink-0 text-sm ring-2 ring-white lg:h-8 lg:w-8 lg:text-xs"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {publisher.kind === 'company' ? 'Tour operator' : 'Hosted by'}
        </p>
        <p className="truncate text-[15px] font-semibold text-neutral-950 dark:text-neutral-50 lg:text-[13px]">
          {hostDisplayName}
        </p>
        {tenant && publisher.kind !== 'company' ? (
          <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">{tenant}</p>
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
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden />
      ) : null}
    </>
  );

  const shell = 'flex items-center gap-3 active:opacity-95';
  const row =
    canOpenHostProfile && hostPath ? (
      <Link to={hostPath} className={shell}>{inner}</Link>
    ) : (
      <div className={shell}>{inner}</div>
    );

  if (embedded) {
    return (
      <div className="space-y-3" aria-label={sectionLabel}>
        <div className="space-y-1">
          {publisher.kind === 'company' ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Tour operator
            </p>
          ) : null}
          {row}
        </div>
        <ActivityGuidesList activity={activity} compact />
      </div>
    );
  }

  return (
    <ConsumerDetailSection
      title={sectionLabel}
      tone="slate"
      ariaLabel={sectionLabel}
      collapsible
      defaultExpanded
    >
      {row}
      <ActivityGuidesList activity={activity} compact />
    </ConsumerDetailSection>
  );
};

const ConsumerDetailActivityReviews = ({ model }: { model: ActivityDetailViewModel }) => {
  const activity = model.activity;
  if (model.previewMode || activity.status !== 'published' || !model.onActivityReviewSubmitted) {
    return null;
  }
  const participantCheckedIn = Boolean(activity.myParticipation?.checkedInAt);
  const activityEnded = activityScheduleHasEnded(activity);
  const activityAwaitingCompletion = participantCheckedIn && !activityEnded;

  const reviewCount = model.activityReviews.length;

  return (
    <ConsumerDetailSection
      id="reviews"
      title={reviewCount > 0 ? `Reviews (${reviewCount})` : 'Reviews'}
      tone="violet"
      ariaLabel="Reviews"
      collapsible
      defaultExpanded
    >
      <ReviewSection
        targetType="activity"
        targetId={activity.id}
        reviews={model.activityReviews}
        onReviewSubmitted={model.onActivityReviewSubmitted}
        canWriteReview={model.canWriteActivityReview}
        activityAwaitingCompletion={activityAwaitingCompletion}
        accent="violet"
        embedded
        hideHeader
      />
    </ConsumerDetailSection>
  );
};
