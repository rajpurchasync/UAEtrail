import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type {
  ActivityDTO,
  LocationPremiumSummaryDTO,
  PlaceNearbyFacilityDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import {
  facilityPlaceKindPinEmoji,
  isFacilityPlaceKind,
  placeKindFromLocationRow,
} from '@uaetrail/shared-types';
import type { PlaceDetailKind, PlaceDetailKindConfig } from '../../../pages/placeDetailConfig';
import type { Place } from '../../../types/place';
import { MobileDetailScrollShell } from '../../../components/mobile/MobileDetailScrollShell';
import {
  DETAIL_SCROLL_MEDIA_BLEED,
  DETAIL_SCROLL_PANEL,
  DETAIL_SCROLL_SECTION_TITLE,
} from '../../../components/mobile/detailScrollSectionStyles';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { ShareButton, ReviewSection, DirectionsControl } from '../../../components/ui';
import { LazyMeetingPointMap } from '../../../detail/shared/LazyMeetingPointMap';
import { PlacePlanList } from '../../placePlanList';
import { PageMeta } from '../../../components/seo/PageMeta';
import { JsonLd } from '../../../components/seo/JsonLd';
import { placeSchema } from '../../../components/seo/schemas';
import { detailBackPath } from '../../../config/routingCatalog';
import { readDetailBackToFromLocation } from '@/discovery/discoveryPortExploreMapPeekNav';
import { EXPLORE_PEEK_CTA } from '../../../config/exploreTheme';
import { buildPlaceDetailPageModel } from '../buildPlaceDetailPageModel';
import { resolvePlaceDisplayTitle, readPlaceArabicName } from '../../../utils/venueDetailDisplay';
import { ConsumerDetailHeroGeoLine } from '../../../detail/shared/ConsumerDetailHeroGeoLine';
import { useGeoAncestorLinks } from '../../../hooks/useGeoAncestorLinks';
import { consumerDetailChildLinkState } from '@/discovery/discoveryPortExploreMapPeekNav';
import { resolvePlaceDetailGeoHero } from '../resolvePlaceDetailGeoHero';
import { placeCoverFallbackClass, resolvePlaceCoverFromPlace } from '../../peek/resolvePlaceRegistryCoverImage';
import { PlaceDetailKindFacts } from '../PlaceDetailKindFacts';
import { splitPlacePracticalTags } from '../../../utils/placePracticalInfo';
import { PLACE_PEEK_FOOTER_PLAN_TRIP, PLACE_PEEK_RATE_LABEL } from '../../../content/placePeekCopy';
import { navigateHostFromPlace } from '../../peek/navigateHostFromPlaceCard';
import { useAuth } from '../../../context/AuthContext';
import { joinAuthPath } from '../../../config/routingCatalog';
import { exploreAddFacilityOnPlacePath } from '@/discovery/discoveryPortExploreRouting';
import { capitalize } from '../../../utils';
import type { DiscoveryCardTone } from '../../../discovery/discoveryCardModel';
import { PLACE_DETAIL_TAB_LABELS } from '../../../place/placeDetailTab';
import { resolvePlaceDetailHeaderChrome } from '../resolvePlaceDetailHeaderChrome';
import { PlacePremiumGuidePanel } from '../../../components/place/PlacePremiumGuidePanel';
import { PlaceDetailGuestGate } from '../../../components/place/detail/PlaceDetailGuestGate';

const toneForKind = (kind: PlaceDetailKind): DiscoveryCardTone => {
  if (kind === 'camp') return 'camping';
  if (kind === 'event') return 'event';
  return 'hiking';
};

export type PlaceDetailSectionsProps = {
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
  guestPreview?: boolean;
};

export const PlaceDetailSections = ({
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
}: PlaceDetailSectionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const addFacilityAlongRoutePath = exploreAddFacilityOnPlacePath(placeId);
  const addFacilityHref = user ? addFacilityAlongRoutePath : joinAuthPath(addFacilityAlongRoutePath);
  const [arranging, setArranging] = useState(false);
  const pageModel = useMemo(
    () => buildPlaceDetailPageModel({ kind, place, config }),
    [kind, place, config]
  );
  const coverUrl = resolvePlaceCoverFromPlace(place);
  const displayName = resolvePlaceDisplayTitle(place.name, place.tags);
  const nameAr =
    readPlaceArabicName(place.tags) ||
    (displayName !== place.name.trim() ? place.name.trim() : null);
  const practical = splitPlacePracticalTags(place.tags);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : null;
  const hasParking =
    (place.parkingLat != null && place.parkingLng != null) || Boolean(place.parkingLink);
  const showTransport =
    hasParking || (place.accessibleBy?.length ?? 0) > 0 || Boolean(place.accessibility);
  const showAmenitiesAlongRoute = kind === 'trail' || kind === 'camp';
  const showNearbySection =
    showAmenitiesAlongRoute ||
    nearbyFacilities.length > 0 ||
    practical.facilities.length > 0 ||
    practical.nearby.length > 0;

  useEffect(() => {
    if (unlockNotice?.toLowerCase().includes('unlocked')) {
      document.getElementById('place-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [unlockNotice]);

  const backTo =
    readDetailBackToFromLocation(location.state) ?? detailBackPath(pageModel.backKind);
  const headerChrome = resolvePlaceDetailHeaderChrome(kind);
  const geoHero = useMemo(
    () =>
      resolvePlaceDetailGeoHero({
        kind,
        place,
        placeId,
        detailPath,
        shareText: pageModel.shareText,
      }),
    [detailPath, kind, pageModel.shareText, place, placeId]
  );
  const geoLinks = useGeoAncestorLinks({ region: geoHero.region, geoRef: geoHero.geoRef });
  const areaLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, headerChrome.label);
  }, [headerChrome.label, location.pathname, location.search]);

  const catalogKind = placeKindFromLocationRow({
    activityType: place.activityType,
    tags: place.tags,
  });
  const isFacilityCatalog = isFacilityPlaceKind(catalogKind);

  const footer = isFacilityCatalog ? undefined : (
    <button
      type="button"
      disabled={arranging}
      onClick={() => {
        setArranging(true);
        void navigateHostFromPlace(navigate, place, kind).finally(() => setArranging(false));
      }}
      className={`${EXPLORE_PEEK_CTA.primary} lg:!rounded-lg lg:!py-2 lg:!text-[13px]`}
    >
      {arranging ? 'Opening…' : PLACE_PEEK_FOOTER_PLAN_TRIP}
    </button>
  );

  const shareControl = (
    <ShareButton
      title={place.name}
      text={pageModel.shareText}
      path={detailPath}
      iconOnly
      light
    />
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
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        data-place-consumer-detail-template
      >
        <MobileDetailScrollShell
          backTo={backTo}
          backLabel=""
          headerChrome={headerChrome}
          headerAction={shareControl}
          footer={footer}
        >
          <div className={`relative mb-4 h-[min(32dvh,220px)] md:mb-6 md:h-[min(40dvh,340px)] lg:mb-3 lg:h-[11rem] ${DETAIL_SCROLL_MEDIA_BLEED}`}>
            {coverUrl ? (
              <EnvironmentImage src={coverUrl} alt="" className="h-full w-full object-cover" loading="eager" />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeCoverFallbackClass(toneForKind(kind))}`}
              >
                <MapPin className="h-12 w-12 text-neutral-400" aria-hidden />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white md:px-6 md:pb-6 lg:px-4 lg:pb-3">
              <ConsumerDetailHeroGeoLine
                geoLinks={geoLinks}
                regionFallback={geoHero.region}
                placeHubLabel={geoHero.placeHubLabel}
                destinationSlug={geoHero.destinationSlug}
                geoHubPath={geoHero.geoHubPath}
                areaLinkState={areaLinkState}
                geoLinkBackLabel={headerChrome.label}
              />
              <h1 className="mt-1 text-[1.5rem] font-bold leading-snug md:text-[1.85rem] lg:mt-0.5 lg:text-lg">{displayName}</h1>
              {nameAr && nameAr !== displayName ? (
                <p className="mt-1 text-sm text-white/90" dir="rtl" lang="ar">{nameAr}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:gap-3">
            {guestPreview && !user ? (
              <PlaceDetailGuestGate placeId={placeId} placeName={displayName} className="mb-1" />
            ) : null}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
            <section className="min-w-0 flex-1" aria-label="At a glance">
              <PlaceDetailKindFacts kind={kind} place={place} />
            </section>

            <section className="shrink-0 md:pt-1" aria-label="Ratings">
              {avgRating != null ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="font-medium text-neutral-500">· {reviews.length} ratings</span>
                </p>
              ) : (
                <p className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <Star className="h-4 w-4 text-amber-300" aria-hidden />
                  <span>No ratings yet</span>
                  <a
                    href="#place-reviews"
                    className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {PLACE_PEEK_RATE_LABEL}
                  </a>
                </p>
              )}
            </section>
            </div>

            {place.description?.trim() ? (
              <section aria-label="About">
                <h2 className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>About</h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800 md:text-base md:leading-7 lg:text-[13px] lg:leading-5">{place.description}</p>
              </section>
            ) : null}

            {pageModel.showSeason && place.season && place.season.length > 0 ? (
              <section aria-label="Best season">
                <h2 className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>Best season</h2>
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
              </section>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 lg:gap-3">
            {showTransport ? (
              <section id="place-detail-transport" aria-label="Getting there">
                <h2 className={`mb-3 ${DETAIL_SCROLL_SECTION_TITLE}`}>
                  {PLACE_DETAIL_TAB_LABELS.transport}
                </h2>
                <div className={`space-y-4 ${DETAIL_SCROLL_PANEL.logistics}`}>
                  {place.accessibility ? (
                    <p className="text-sm text-neutral-800">
                      <span className="font-semibold">Access:</span>{' '}
                      {capitalize(place.accessibility.replace('-', ' '))}
                    </p>
                  ) : null}
                  {place.accessibleBy && place.accessibleBy.length > 0 ? (
                    <div>
                      <p className={`${DETAIL_SCROLL_SECTION_TITLE} mb-1`}>Accessible by</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-neutral-800">
                        {place.accessibleBy.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {place.parkingLat != null && place.parkingLng != null ? (
                    <div>
                      <p className={`${DETAIL_SCROLL_SECTION_TITLE} mb-2`}>Parking</p>
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
              </section>
            ) : null}

            {showNearbySection ? (
              <section aria-label="Nearby facilities">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={DETAIL_SCROLL_SECTION_TITLE}>Along this route</h2>
                  {showAmenitiesAlongRoute ? (
                    <Link
                      to={addFacilityHref}
                      className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
                    >
                      Add amenity · drop a pin
                    </Link>
                  ) : null}
                </div>
                <div className={`space-y-3 ${DETAIL_SCROLL_PANEL.social}`}>
                  {nearbyFacilities.length === 0 && showAmenitiesAlongRoute ? (
                    <p className="text-sm text-neutral-600">
                      Toilets, water, rest stops, and gear pins along this route appear here after members add them
                      on the map.
                    </p>
                  ) : null}
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
                      <p className={`${DETAIL_SCROLL_SECTION_TITLE} mb-1`}>On site</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-neutral-800">
                        {practical.facilities.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {practical.nearby.length > 0 ? (
                    <div>
                      <p className={`${DETAIL_SCROLL_SECTION_TITLE} mb-1`}>Nearby</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-neutral-800">
                        {practical.nearby.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
            </div>

            <PlacePlanList activities={activities} />

            <section id="place-guide" aria-label={PLACE_DETAIL_TAB_LABELS.guide}>
                <h2 className={`mb-3 ${DETAIL_SCROLL_SECTION_TITLE}`}>{PLACE_DETAIL_TAB_LABELS.guide}</h2>
                <div className={DETAIL_SCROLL_PANEL.prep}>
                  <PlacePremiumGuidePanel
                    placeId={placeId}
                    placeName={displayName}
                    premium={premium}
                    onPremiumChange={(value) => onPremiumChange(value)}
                    unlockNotice={unlockNotice}
                    onDismissUnlockNotice={onDismissUnlockNotice}
                    accent={config.accent === 'emerald' ? undefined : config.accent}
                  />
                </div>
            </section>

            <section id="place-reviews" aria-label="Reviews">
              <h2 className={`mb-2 ${DETAIL_SCROLL_SECTION_TITLE}`}>Reviews</h2>
              <ReviewSection
                targetType="place"
                targetId={placeId}
                reviews={reviews}
                onReviewSubmitted={onReviewSubmitted}
                accent={config.accent === 'emerald' ? undefined : config.accent}
              />
            </section>
          </div>
        </MobileDetailScrollShell>
      </div>
    </>
  );
};
