import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type {
  ActivityDTO,
  LocationPremiumSummaryDTO,
  PlaceNearbyFacilityDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import { areaDetailPath } from '@uaetrail/shared-types';
import {
  facilityPlaceKindPinEmoji,
  isFacilityPlaceKind,
  placeKindFromLocationRow,
} from '@uaetrail/shared-types';
import type { PlaceDetailKind, PlaceDetailKindConfig } from '../../../pages/placeDetailConfig';
import type { Place } from '../../../types/place';
import { ActivityConsumerDetailModalShell } from '../../../activity/detail/templates/ActivityConsumerDetailModalShell';
import { CONSUMER_DETAIL_PANEL, CONSUMER_DETAIL_SECTION_TITLE } from '../../../activity/detail/templates/activityConsumerDetailSectionStyles';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { ShareButton, ReviewSection, MeetingPointMap, DirectionsControl } from '../../../components/ui';
import { ProfileActivityListRow } from '../../../components/profile/ProfileActivityListRow';
import { PageMeta } from '../../../components/seo/PageMeta';
import { JsonLd } from '../../../components/seo/JsonLd';
import { placeSchema } from '../../../components/seo/schemas';
import { detailBackPath } from '../../../config/routingCatalog';
import { EXPLORE_PEEK_CTA } from '../../../config/exploreTheme';
import { buildPlaceDetailPageModel } from '../buildPlaceDetailPageModel';
import { resolvePlaceDisplayTitle, readPlaceArabicName } from '../../../utils/venueDetailDisplay';
import { resolvePlaceAreaLabelFromTags } from '../resolvePlaceAreaFromTags';
import { placeCoverFallbackClass, resolvePlaceCoverFromPlace } from '../../peek/resolvePlaceRegistryCoverImage';
import { PlaceConsumerKindFacts } from '../PlaceConsumerKindFacts';
import { splitPlacePracticalTags } from '../../../utils/placePracticalInfo';
import { PLACE_PEEK_ARRANGE_TRIP, PLACE_PEEK_RATE_LABEL, PLACE_PEEK_SCHEDULED } from '../../../content/placePeekCopy';
import { navigateHostFromPlace } from '../../peek/navigateHostFromPlaceCard';
import { capitalize } from '../../../utils';
import type { DiscoveryCardTone } from '../../../discovery/discoveryCardModel';
import { PLACE_DETAIL_TAB_LABELS } from '../../../place/placeDetailTab';
import { resolvePlaceConsumerDetailHeaderChrome } from '../resolvePlaceConsumerDetailHeaderChrome';
import { PlacePremiumGuidePanel } from '../../../components/place/PlacePremiumGuidePanel';

const toneForKind = (kind: PlaceDetailKind): DiscoveryCardTone => {
  if (kind === 'camp') return 'camping';
  if (kind === 'event') return 'event';
  return 'hiking';
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
}: PlaceConsumerDetailPageProps) => {
  const navigate = useNavigate();
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
  const areaLabel = place.areaName?.trim() || place.areaLabel?.trim() || resolvePlaceAreaLabelFromTags(place.tags);
  const areaSlug = place.areaSlug?.trim() || null;
  const practical = splitPlacePracticalTags(place.tags);
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

  useEffect(() => {
    if (unlockNotice?.toLowerCase().includes('unlocked')) {
      document.getElementById('place-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [unlockNotice]);

  const backTo = detailBackPath(pageModel.backKind);
  const headerChrome = resolvePlaceConsumerDetailHeaderChrome(kind);

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
      className={EXPLORE_PEEK_CTA.primary}
    >
      {arranging ? 'Opening…' : PLACE_PEEK_ARRANGE_TRIP}
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

      <div data-place-consumer-detail-template>
        <ActivityConsumerDetailModalShell
          backTo={backTo}
          backLabel={config.backLabel}
          headerChrome={headerChrome}
          headerAction={shareControl}
          footer={footer}
        >
          <div className="relative -mx-4 mb-4 h-[min(32dvh,220px)] w-[calc(100%+2rem)] overflow-hidden bg-neutral-100">
            {coverUrl ? (
              <EnvironmentImage src={coverUrl} alt="" className="h-full w-full object-cover" loading="eager" />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeCoverFallbackClass(toneForKind(kind))}`}
              >
                <MapPin className="h-12 w-12 text-neutral-400" aria-hidden />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white">
              <p className="text-sm font-medium text-white/90">{place.region}</p>
              {areaLabel ? (
                <p className="text-sm font-semibold">
                  {areaSlug ? (
                    <Link
                      to={areaDetailPath(areaSlug)}
                      className="underline decoration-white/40 underline-offset-2 hover:text-white"
                    >
                      {areaLabel}
                    </Link>
                  ) : (
                    areaLabel
                  )}
                </p>
              ) : null}
              <h1 className="mt-1 text-[26px] font-bold leading-snug">{displayName}</h1>
              {nameAr && nameAr !== displayName ? (
                <p className="mt-1 text-sm text-white/90" dir="rtl" lang="ar">{nameAr}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <section aria-label="At a glance">
              <PlaceConsumerKindFacts kind={kind} place={place} />
            </section>

            <section aria-label="Ratings">
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

            {place.description?.trim() ? (
              <section aria-label="About">
                <h2 className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>About</h2>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-800">{place.description}</p>
              </section>
            ) : null}

            {pageModel.showSeason && place.season && place.season.length > 0 ? (
              <section aria-label="Best season">
                <h2 className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Best season</h2>
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

            {showTransport ? (
              <section id="place-detail-transport" aria-label="Getting there">
                <h2 className={`mb-3 ${CONSUMER_DETAIL_SECTION_TITLE}`}>
                  {PLACE_DETAIL_TAB_LABELS.transport}
                </h2>
                <div className={`space-y-4 ${CONSUMER_DETAIL_PANEL.logistics}`}>
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
                      <MeetingPointMap lat={place.parkingLat} lng={place.parkingLng} label="Parking" hideExternalLink />
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

            {activities.length > 0 ? (
              <section aria-label={PLACE_PEEK_SCHEDULED}>
                <h2 className={`mb-3 ${CONSUMER_DETAIL_SECTION_TITLE}`}>{PLACE_PEEK_SCHEDULED}</h2>
                <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
                  {activities.map((activity) => (
                    <li key={activity.id}>
                      <ProfileActivityListRow activity={activity} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section id="place-guide" aria-label={PLACE_DETAIL_TAB_LABELS.guide}>
                <h2 className={`mb-3 ${CONSUMER_DETAIL_SECTION_TITLE}`}>{PLACE_DETAIL_TAB_LABELS.guide}</h2>
                <div className={CONSUMER_DETAIL_PANEL.prep}>
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

            {showNearbySection ? (
              <section aria-label="Nearby facilities">
                <h2 className={`mb-3 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Nearby facilities</h2>
                <div className={`space-y-3 ${CONSUMER_DETAIL_PANEL.social}`}>
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
              </section>
            ) : null}

            <section id="place-reviews" aria-label="Reviews">
              <h2 className={`mb-2 ${CONSUMER_DETAIL_SECTION_TITLE}`}>Reviews</h2>
              <ReviewSection
                targetType="place"
                targetId={placeId}
                reviews={reviews}
                onReviewSubmitted={onReviewSubmitted}
                accent={config.accent === 'emerald' ? undefined : config.accent}
              />
            </section>
          </div>
        </ActivityConsumerDetailModalShell>
      </div>
    </>
  );
};
