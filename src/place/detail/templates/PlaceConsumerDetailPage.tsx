import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import type {
  ActivityDTO,
  LocationPremiumSummaryDTO,
  PlaceNearbyFacilityDTO,
  PlaceTrackPreviewDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { activityDetailPath } from '@uaetrail/shared-types';
import {
  facilityPlaceKindPinEmoji,
  isFacilityPlaceKind,
  placeKindFromLocationRow,
} from '@uaetrail/shared-types';
import type { PlaceDetailKind, PlaceDetailKindConfig } from '../../../pages/placeDetailConfig';
import type { Place } from '../../../types/place';
import { CONSUMER_DETAIL_PANEL, CONSUMER_DETAIL_SECTION_TITLE } from '../../../activity/detail/templates/activityConsumerDetailSectionStyles';
import {
  ConsumerDetailSection,
  ConsumerDetailSectionJumpNav,
  DetailPageShell,
  HeroBanner,
  SectionCard,
} from '../../../detail/shell';
import { DetailHeroPhotoStrip } from '../../../detail/shared/DetailHeroPhotoStrip';
import { collectDetailHeroPhotos } from '../../../detail/shared/detailHeroPhotos';
import { ConsumerDetailHeroGeoLine } from '../../../detail/shared/ConsumerDetailHeroGeoLine';
import { useGeoAncestorLinks } from '../../../hooks/useGeoAncestorLinks';
import { ReviewSection, DirectionsControl } from '../../../components/ui';
import { DetailHeroShareButton } from '../../../detail/shared/DetailHeroShareButton';
import { LazyMeetingPointMap } from '../../../detail/shared/LazyMeetingPointMap';
import { ProfileActivityListRow } from '../../../components/profile/ProfileActivityListRow';
import { PageMeta } from '../../../components/seo/PageMeta';
import { JsonLd } from '../../../components/seo/JsonLd';
import { placeSchema } from '../../../components/seo/schemas';
import { detailBackPath } from '../../../config/routingCatalog';
import {
  consumerDetailChildLinkState,
  readDetailBackToFromLocation,
} from '../../../explore/mapPeekDetailNavState';
import { EXPLORE_PEEK_CTA } from '../../../config/exploreTheme';
import { buildPlaceDetailDiscoveryCard } from '../buildPlaceDetailDiscoveryCard';
import { buildPlaceConsumerDetailJumpLinks } from '../buildPlaceConsumerDetailJumpLinks';
import { buildPlaceDetailPageModel } from '../buildPlaceDetailPageModel';
import { parseMobileBackNavState } from '../../../utils/mobileBackNav';
import { ExploreWishlistSaveButton } from '../../../explore/ui/ExploreWishlistSaveButton';
import { resolvePlaceDisplayTitle, readPlaceArabicName } from '../../../utils/venueDetailDisplay';
import { resolvePlaceAreaLabelFromTags } from '../resolvePlaceAreaFromTags';
import { resolvePlaceCoverFromPlace } from '../../peek/resolvePlaceRegistryCoverImage';
import { PlaceConsumerKindFacts } from '../PlaceConsumerKindFacts';
import { PlaceReachableRidesSection } from '../PlaceReachableRidesSection';
import { resolvePlacePeekAudienceFromPlace } from '../../peek/resolvePlacePeekCatalogFacts';
import { splitPlacePracticalTags } from '../../../utils/placePracticalInfo';
import { PLACE_PEEK_ARRANGE_TRIP, PLACE_PEEK_RATE_LABEL, PLACE_PEEK_SCHEDULED } from '../../../content/placePeekCopy';
import { navigateHostFromPlace } from '../../peek/navigateHostFromPlaceCard';
import { capitalize } from '../../../utils';
import {
  PLACE_DETAIL_TAB_QUERY,
  parsePlaceDetailTabParam,
  type PlaceDetailTabId,
} from '../../../place/placeDetailTab';
import { resolvePlaceConsumerDetailHeaderChrome } from '../resolvePlaceConsumerDetailHeaderChrome';
import { PlacePremiumGuidePanel } from '../../../components/place/PlacePremiumGuidePanel';
import { PlaceElevationProfile } from '../../../components/place/PlaceElevationProfile';
import { PlaceDetailWeatherSection } from '../../../components/place/PlaceDetailWeatherSection';
import { fetchPublicPlaceTrackPreview } from '../../../hooks/placeTrackPreviewClientApi';
import { useActivePlatformAlerts } from '../../../hooks/useActivePlatformAlerts';
import { ConsumerDetailPlatformAlertBanner } from '../../../detail/ConsumerDetailPlatformAlertBanner';
import { PlaceDetailGuestGate } from '../../../components/place/detail/PlaceDetailGuestGate';
import { GUEST_PLACE_DETAIL_PREVIEW_FOOTER_HINT } from '../../../content/guestJoinCopy';
import {
  CONSUMER_DETAIL_KEY_FACTS_LABEL,
  CONSUMER_DETAIL_OVERVIEW_LABEL,
} from '../../../content/consumerDetailSectionLabels';

const PlaceTrackPreviewMapLazy = lazy(() =>
  import('../../../components/place/PlaceTrackPreviewMap').then((m) => ({ default: m.PlaceTrackPreviewMap }))
);

const PLACE_TAB_SCROLL_ANCHORS: Record<PlaceDetailTabId, string> = {
  overview: 'place-detail-about',
  facts: 'place-detail-map-elevation',
  transport: 'place-detail-transport',
  guide: 'place-guide',
};

export type PlaceConsumerDetailPageProps = {
  kind: PlaceDetailKind;
  config: PlaceDetailKindConfig;
  place: Place;
  placeId: string;
  detailPath: string;
  activities: ActivityDTO[];
  reviews: ReviewDTO[];
  nearbyFacilities: PlaceNearbyFacilityDTO[];
  premium: LocationPremiumSummaryDTO | null;
  onPremiumChange: (value: LocationPremiumSummaryDTO | null) => void;
  unlockNotice: string | null;
  onDismissUnlockNotice: () => void;
  onReviewSubmitted: (review: ReviewDTO) => void;
  /** Signed-out visitor — redacted body; sign-in gate + preview jump chips only. */
  guestPreview?: boolean;
};

export const PlaceConsumerDetailPage = ({
  kind,
  config,
  place,
  placeId,
  detailPath,
  activities,
  reviews,
  nearbyFacilities,
  premium,
  onPremiumChange,
  unlockNotice,
  onDismissUnlockNotice,
  onReviewSubmitted,
  guestPreview = false,
}: PlaceConsumerDetailPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inboundTab = parsePlaceDetailTabParam(searchParams.get(PLACE_DETAIL_TAB_QUERY));
  const [arranging, setArranging] = useState(false);
  const mapSectionRef = useRef<HTMLElement | null>(null);
  const [trackSectionVisible, setTrackSectionVisible] = useState(false);
  const [trackPreview, setTrackPreview] = useState<PlaceTrackPreviewDTO | null | undefined>(undefined);
  const pageModel = useMemo(
    () => buildPlaceDetailPageModel({ kind, place, config }),
    [kind, place, config]
  );
  const wishlistCard = useMemo(
    () =>
      buildPlaceDetailDiscoveryCard({
        kind,
        place,
        placeId,
        detailPath,
        shareText: pageModel.shareText,
      }),
    [kind, place, placeId, detailPath, pageModel.shareText]
  );
  const coverUrl = resolvePlaceCoverFromPlace(place);
  const displayName = resolvePlaceDisplayTitle(place.name, place.tags);
  const nameAr =
    readPlaceArabicName(place.tags) ||
    (displayName !== place.name.trim() ? place.name.trim() : null);
  const areaLabel = place.areaName?.trim() || place.areaLabel?.trim() || resolvePlaceAreaLabelFromTags(place.tags);
  const areaSlug = place.areaSlug?.trim() || null;
  const practical = splitPlacePracticalTags(place.tags);
  const forecastLat =
    place.latitude ?? place.parkingLat ?? null;
  const forecastLng =
    place.longitude ?? place.parkingLng ?? null;
  const showPlaceWeather =
    typeof forecastLat === 'number' &&
    typeof forecastLng === 'number' &&
    !Number.isNaN(forecastLat) &&
    !Number.isNaN(forecastLng);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : null;
  const hasParking =
    (place.parkingLat != null && place.parkingLng != null) || Boolean(place.parkingLink);
  const showTransport =
    hasParking || (place.accessibleBy?.length ?? 0) > 0 || Boolean(place.accessibility);
  const showNearbySection =
    nearbyFacilities.length > 0 || practical.facilities.length > 0 || practical.nearby.length > 0;

  const platformAlerts = useActivePlatformAlerts({
    enabled: showPlaceWeather,
    lat: forecastLat,
    lng: forecastLng,
    radiusKm: 120,
    region: place.region,
  });

  useEffect(() => {
    if (unlockNotice?.toLowerCase().includes('unlocked')) {
      document.getElementById('place-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [unlockNotice]);

  useEffect(() => {
    if (kind !== 'trail') return;
    const el = mapSectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setTrackSectionVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTrackSectionVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '140px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [kind, placeId]);

  useEffect(() => {
    if (guestPreview || !trackSectionVisible || kind !== 'trail') return;
    let cancelled = false;
    void fetchPublicPlaceTrackPreview(placeId)
      .then((data) => {
        if (!cancelled) setTrackPreview(data);
      })
      .catch(() => {
        if (!cancelled) setTrackPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guestPreview, trackSectionVisible, kind, placeId]);

  const backTo =
    readDetailBackToFromLocation(location.state) ?? detailBackPath(pageModel.backKind);
  const headerChrome = resolvePlaceConsumerDetailHeaderChrome(kind);
  const areaLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, headerChrome.label);
  }, [headerChrome.label, location.pathname, location.search]);
  const geoLinks = useGeoAncestorLinks({ region: place.region });
  const heroPhotos = useMemo(
    () =>
      collectDetailHeroPhotos([
        {
          srcs: [...(place.images ?? []), coverUrl],
          title: displayName,
          kindLabel: headerChrome.label,
          href: detailPath,
        },
        ...activities.map((activity) => ({
          srcs: [...(activity.images ?? []), activity.bannerUrl],
          title: activity.title,
          kindLabel: 'Outing',
          href: activityDetailPath(activity.id),
        })),
      ]),
    [activities, coverUrl, detailPath, displayName, headerChrome.label, place.images]
  );

  const catalogKind = placeKindFromLocationRow({
    activityType: place.activityType,
    tags: place.tags,
  });
  const isFacilityCatalog = isFacilityPlaceKind(catalogKind);
  const audienceLabels = useMemo(() => resolvePlacePeekAudienceFromPlace(place), [place]);
  const hasAbout = Boolean(place.description?.trim());
  const jumpLinks = useMemo(
    () =>
      buildPlaceConsumerDetailJumpLinks({
        guestPreview,
        kind,
        hasAbout,
        showMapElevation: kind === 'trail',
        showSeason: pageModel.showSeason,
        showTransport,
        showNearby: showNearbySection,
        showAmenities: kind === 'camp' && practical.facilities.length > 0,
        showWeather: showPlaceWeather,
        showScheduled: activities.length > 0,
        showRides: !isFacilityCatalog,
        showGuide: kind === 'trail',
      }),
    [
      guestPreview,
      kind,
      hasAbout,
      pageModel.showSeason,
      showTransport,
      showNearbySection,
      practical.facilities.length,
      showPlaceWeather,
      activities.length,
      isFacilityCatalog,
    ]
  );

  useEffect(() => {
    const anchor = PLACE_TAB_SCROLL_ANCHORS[inboundTab];
    if (!anchor || inboundTab === 'overview') return;
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [inboundTab, placeId]);

  const guestFooter = guestPreview ? (
    <p className="text-center text-xs font-medium leading-snug text-neutral-600 dark:text-neutral-400">
      {GUEST_PLACE_DETAIL_PREVIEW_FOOTER_HINT}
    </p>
  ) : undefined;

  const footer = guestPreview
    ? guestFooter
    : isFacilityCatalog
      ? undefined
      : (
    <button
      type="button"
      disabled={arranging}
      onClick={() => {
        setArranging(true);
        void navigateHostFromPlace(navigate, place, kind).finally(() => setArranging(false));
      }}
      className={`${EXPLORE_PEEK_CTA.primary} lg:!rounded-lg lg:!py-2 lg:!text-[13px]`}
    >
      {arranging ? 'Opening…' : PLACE_PEEK_ARRANGE_TRIP}
    </button>
      );

  const asidePanel =
    guestPreview || (!footer && audienceLabels.length === 0)
      ? undefined
      : (
      <div className="space-y-3">
        {audienceLabels.length > 0 ? (
          <div className="hidden md:block">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Good for</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {audienceLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {guestPreview ? null : footer}
      </div>
    );

  const heroTopActions = (
    <div className="flex items-center gap-1.5">
      {!isFacilityCatalog && !guestPreview ? <ExploreWishlistSaveButton card={wishlistCard} bare /> : null}
      <DetailHeroShareButton
        title={place.name}
        text={pageModel.shareText}
        path={detailPath}
        shareSurface="place"
      />
    </div>
  );

  return (
    <>
      <PageMeta
        title={place.name}
        description={place.description?.slice(0, 160) ?? `Explore ${place.name} — ${place.region}, UAE`}
        path={detailPath}
        image={place.images[0]}
        imageAlt={`${place.name} — ${config.imageAltSuffix}`}
      />
      <JsonLd data={placeSchema(place)} id={`${kind}-${place.id}`} />

      <div
        data-place-consumer-detail-template
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <DetailPageShell
          backTo={backTo}
          backLabel={parseMobileBackNavState(location.state)?.backLabel ?? 'Explore'}
          headerChrome={headerChrome}
          preferDeclaredBackLabel
          footer={footer}
          footerClassName={footer ? 'md:hidden' : undefined}
          jumpRow={
            <>
              <ConsumerDetailSectionJumpNav links={jumpLinks} />
              {guestPreview ? (
                <PlaceDetailGuestGate
                  placeId={placeId}
                  placeName={displayName}
                  compact
                  className="mb-3 md:mb-2"
                />
              ) : null}
            </>
          }
          hero={
            heroPhotos.length > 0 ? (
              <div className="-mx-4 mb-4 min-w-0 max-w-[calc(100%+2rem)] overflow-hidden max-lg:-mt-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))] max-lg:pt-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))] md:-mx-6 md:max-w-[calc(100%+3rem)] lg:mx-0 lg:mb-2 lg:mt-0 lg:max-w-full lg:pt-0">
                <DetailHeroPhotoStrip
                  photos={heroPhotos}
                  topEndAction={heroTopActions}
                  mobileOverlayLayout="centered"
                  selfDetailPath={detailPath}
                  ariaLabel={`${displayName} photos`}
                  overlay={
                    <>
                      <h1 className="landing-hero-headline font-black leading-[1.18] [overflow-wrap:anywhere] md:text-[2rem] md:leading-[1.15] lg:text-[2.125rem]">
                        {displayName}
                      </h1>
                  <ConsumerDetailHeroGeoLine
                    geoLinks={geoLinks}
                    regionFallback={place.region}
                    areaLabel={areaLabel}
                    areaSlug={areaSlug}
                    areaLinkState={areaLinkState}
                    geoLinkBackLabel={headerChrome.label}
                  />
                      {nameAr && nameAr !== displayName ? (
                        <p className="text-sm text-white/90" dir="rtl" lang="ar">
                          {nameAr}
                        </p>
                      ) : null}
                    </>
                  }
                />
              </div>
            ) : (
              <HeroBanner
                imageUrl={coverUrl}
                topEndAction={heroTopActions}
                mobileTitleLayout="center"
                typeBadge={
                  <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                    {headerChrome.label}
                  </span>
                }
                title={displayName}
                subtitle={
                  <ConsumerDetailHeroGeoLine
                    geoLinks={geoLinks}
                    regionFallback={place.region}
                    areaLabel={areaLabel}
                    areaSlug={areaSlug}
                    areaLinkState={areaLinkState}
                    geoLinkBackLabel={headerChrome.label}
                  />
                }
              />
            )
          }
          alerts={
            <ConsumerDetailPlatformAlertBanner
              alerts={platformAlerts}
              label="Safety and conditions"
              className="mb-1 md:mb-2"
            />
          }
          keyFacts={
            <ConsumerDetailSection
              id="place-detail-at-a-glance"
              title={CONSUMER_DETAIL_KEY_FACTS_LABEL}
              tone="slate"
              ariaLabel={CONSUMER_DETAIL_KEY_FACTS_LABEL}
              className="!mt-0"
              collapsible
              defaultExpanded
            >
              <PlaceConsumerKindFacts kind={kind} place={place} showAudience />
              {avgRating != null ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="font-medium text-neutral-500">
                    · {reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'}
                  </span>
                </p>
              ) : (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <Star className="h-4 w-4 text-amber-300" aria-hidden />
                  <span>No ratings yet</span>
                  <a href="#place-reviews" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                    {PLACE_PEEK_RATE_LABEL}
                  </a>
                </p>
              )}
            </ConsumerDetailSection>
          }
          aside={asidePanel}
        >
            {place.description?.trim() ? (
              <SectionCard
                id="place-detail-about"
                title={CONSUMER_DETAIL_OVERVIEW_LABEL}
                tone="emerald"
                collapsible
                defaultExpanded
                bodyClassName={
                  guestPreview
                    ? undefined
                    : 'max-h-[min(12rem,30vh)] overflow-y-auto overscroll-contain scroll-touch pr-0.5 lg:max-h-[min(10rem,26vh)]'
                }
              >
                <p
                  className={`whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 md:text-base md:leading-7 lg:text-[13px] lg:leading-5${
                    guestPreview ? ' line-clamp-5' : ''
                  }`}
                >
                  {place.description}
                </p>
                {guestPreview ? (
                  <p className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Join free to read the full description, map, directions, and community reviews.
                  </p>
                ) : null}
              </SectionCard>
            ) : null}

            {guestPreview ? null : (
              <>
            {kind === 'trail' ? (
              <ConsumerDetailSection
                ref={mapSectionRef}
                id="place-detail-map-elevation"
                title="Map and elevation"
                tone="sky"
                ariaLabel="Map and elevation"
                collapsible
                defaultExpanded
              >
                {trackSectionVisible && trackPreview === undefined ? (
                  <div className="space-y-2" aria-hidden>
                    <div className="aspect-[16/9] max-w-full animate-pulse rounded-xl bg-neutral-100" />
                  </div>
                ) : null}
                {trackPreview && (trackPreview.polyline || trackPreview.bbox) ? (
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600 lg:text-[13px] lg:leading-5">
                      Route preview. Download the GPX from Guided information when you have access.
                    </p>
                    <Suspense
                      fallback={
                        <div className="aspect-[16/9] max-w-full animate-pulse rounded-xl border border-neutral-100 bg-neutral-50 lg:aspect-[21/9] lg:max-h-[140px]" />
                      }
                    >
                      <div className="lg:max-h-[140px] lg:overflow-hidden lg:[&_.leaflet-container]:!max-h-[140px]">
                        <PlaceTrackPreviewMapLazy polyline={trackPreview.polyline} bbox={trackPreview.bbox} />
                      </div>
                    </Suspense>
                    {trackPreview.profile && trackPreview.profile.length >= 2 ? (
                      <div className={`${CONSUMER_DETAIL_PANEL.social} rounded-xl border border-neutral-100 p-3`}>
                        <PlaceElevationProfile profile={trackPreview.profile} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </ConsumerDetailSection>
            ) : null}

            {pageModel.showSeason && place.season && place.season.length > 0 ? (
              <ConsumerDetailSection
                id="place-detail-season"
                title="Best season"
                tone="rose"
                ariaLabel="Best season"
                collapsible
                defaultExpanded
              >
                <div className="flex flex-wrap gap-2">
                  {place.season.map((season) => (
                    <span
                      key={season}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold capitalize text-neutral-800"
                    >
                      {season}
                    </span>
                  ))}
                </div>
              </ConsumerDetailSection>
            ) : null}

            <div
              id="place-detail-details"
              className="flex flex-col gap-3 max-lg:[&_section]:!mt-0"
            >
            <PlaceReachableRidesSection placeId={placeId} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch [&>section]:!mt-0">
            {showTransport ? (
              <ConsumerDetailSection
                id="place-detail-transport"
                title="Getting there"
                tone="sky"
                ariaLabel="Getting there"
                collapsible
                defaultExpanded
                className="h-full min-h-0"
              >
                <div className="space-y-4">
                  {place.accessibility ? (
                    <p className="text-sm text-neutral-800">
                      <span className="font-semibold">Access:</span>{' '}
                      {capitalize(place.accessibility.replace('-', ' '))}
                    </p>
                  ) : null}
                  {place.accessibleBy && place.accessibleBy.length > 0 ? (
                    <div>
                      <p className={`${CONSUMER_DETAIL_SECTION_TITLE} mb-1`}>Accessible by</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-neutral-800">
                        {place.accessibleBy.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {place.parkingLat != null && place.parkingLng != null ? (
                    <div>
                      <p className={`${CONSUMER_DETAIL_SECTION_TITLE} mb-2`}>Parking</p>
                      <LazyMeetingPointMap lat={place.parkingLat} lng={place.parkingLng} label="Parking" hideExternalLink />
                      <DirectionsControl
                        lat={place.parkingLat}
                        lng={place.parkingLng}
                        variant="link"
                        label="Directions to parking"
                        className="mt-2 text-sm font-semibold text-emerald-800"
                      />
                    </div>
                  ) : null}
                </div>
              </ConsumerDetailSection>
            ) : null}

            {showNearbySection ? (
              <ConsumerDetailSection
                id="place-detail-nearby"
                title="Nearby facilities"
                tone="violet"
                ariaLabel="Nearby facilities"
                collapsible
                defaultExpanded
                className="h-full min-h-0"
              >
                <div className="space-y-3">
                  {nearbyFacilities.length > 0 ? (
                    <ul className="divide-y divide-neutral-100">
                      {nearbyFacilities.map((facility) => (
                        <li key={facility.id}>
                          <Link
                            to={facility.path}
                            className="flex items-center gap-3 py-2.5 text-sm font-semibold text-neutral-900 hover:text-emerald-800"
                          >
                            <span className="text-lg" aria-hidden>
                              {facilityPlaceKindPinEmoji(facility.placeKind)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{facility.name}</span>
                              <span className="block text-xs font-medium text-neutral-500">{facility.label}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {practical.facilities.length > 0 ? (
                    <div>
                      <p className={`${CONSUMER_DETAIL_SECTION_TITLE} mb-1`}>On site</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-neutral-800">
                        {practical.facilities.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {practical.nearby.length > 0 ? (
                    <div>
                      <p className={`${CONSUMER_DETAIL_SECTION_TITLE} mb-1`}>Nearby</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-neutral-800">
                        {practical.nearby.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </ConsumerDetailSection>
            ) : null}
            </div>
            </div>

            {kind === 'camp' && practical.facilities.length > 0 ? (
              <SectionCard
                id="place-detail-amenities"
                title="Amenities"
                tone="amber"
                collapsible
                defaultExpanded
              >
                <ul className="list-disc ps-5 text-sm text-neutral-800">
                  {practical.facilities.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {showPlaceWeather ? (
              <ConsumerDetailSection
                id="place-detail-safety"
                title="Safety and conditions"
                tone="indigo"
                ariaLabel="Safety and conditions"
                collapsible
                defaultExpanded
              >
                <PlaceDetailWeatherSection
                  lat={forecastLat}
                  lng={forecastLng}
                  forecastForName={displayName}
                  className="mt-0"
                />
              </ConsumerDetailSection>
            ) : null}

            {activities.length > 0 ? (
              <ConsumerDetailSection
                id="place-detail-scheduled"
                title={PLACE_PEEK_SCHEDULED}
                tone="emerald"
                ariaLabel={PLACE_PEEK_SCHEDULED}
                collapsible
                defaultExpanded
              >
                <ul className="divide-y divide-neutral-200/80">
                  {activities.map((activity) => (
                    <li key={activity.id}>
                      <ProfileActivityListRow activity={activity} variant="plain" />
                    </li>
                  ))}
                </ul>
              </ConsumerDetailSection>
            ) : null}

            {kind === 'trail' ? (
            <ConsumerDetailSection
                id="place-guide"
                title="Guide"
                tone="amber"
                ariaLabel="Guide"
                collapsible
                defaultExpanded={false}
              >
                  <PlacePremiumGuidePanel
                    placeId={placeId}
                    placeName={displayName}
                    premium={premium}
                    onPremiumChange={(value) => onPremiumChange(value)}
                    unlockNotice={unlockNotice}
                    onDismissUnlockNotice={onDismissUnlockNotice}
                    accent={config.accent === 'emerald' ? undefined : config.accent}
                  />
            </ConsumerDetailSection>
            ) : null}

            <ConsumerDetailSection
              id="place-reviews"
              title="Reviews"
              tone="violet"
              ariaLabel="Reviews"
              collapsible
              defaultExpanded={false}
            >
              <ReviewSection
                targetType="place"
                targetId={placeId}
                reviews={reviews}
                onReviewSubmitted={onReviewSubmitted}
                accent={config.accent === 'emerald' ? undefined : config.accent}
              />
            </ConsumerDetailSection>
              </>
            )}
        </DetailPageShell>
      </div>
    </>
  );
};
