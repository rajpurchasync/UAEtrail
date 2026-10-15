import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Car, ChevronRight } from 'lucide-react';
import type { ActivityDTO, LocationPremiumSummaryDTO, ReviewDTO } from '@uaetrail/shared-types';
import {
  ShareButton,
  PlaceDetailTabs,
  toPlaceDetailData,
  ReviewSection,
} from '../ui';
import { ProfileActivityListRow } from '../profile/ProfileActivityListRow';
import { PageMeta } from '../seo/PageMeta';
import { JsonLd } from '../seo/JsonLd';
import { placeSchema } from '../seo/schemas';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import { getDifficultyColor, capitalize } from '../../utils';
import type { Place } from '../../types/place';
import { activitiesBrowsePath } from '../../config/activityTypes';
import { detailBackPath, myActivitiesPath } from '../../config/routingCatalog';
import type { PlaceDetailKind, PlaceDetailKindConfig } from '../../pages/placeDetailConfig';
import { readPlaceArabicName, resolvePlaceDisplayTitle } from '../../utils/venueDetailDisplay';
import {
  CONTRIBUTE_PLACE_PENDING_BANNER_BODY,
  CONTRIBUTE_PLACE_PENDING_BANNER_TITLE,
} from '../../explore/createFlowCopy';
import { linkClassForAccent, ringClassForAccent, seasonClassForAccent } from './placeDetailAccentStyles';
import {
  PLACE_DETAIL_TAB_QUERY,
  parsePlaceDetailTabParam,
  type PlaceDetailTabId,
} from '../../place/placeDetailTab';
import { buildPlaceDetailPageModel } from '../../place/detail/buildPlaceDetailPageModel';
import type { PlaceDetailHeroKindSectionComponent } from '../../place/detail/composers';

const jsonLdForPlace = (_kind: PlaceDetailKind, place: Place) => placeSchema(place);

export type PlaceDetailCoreProps = {
  kind: PlaceDetailKind;
  config: PlaceDetailKindConfig;
  heroKindSection: PlaceDetailHeroKindSectionComponent;
  place: Place;
  placeId: string;
  detailPath: string;
  activities: ActivityDTO[];
  reviews: ReviewDTO[];
  premium: LocationPremiumSummaryDTO | null;
  onPremiumChange: (value: LocationPremiumSummaryDTO | null) => void;
  selectedImage: number;
  onSelectedImageChange: (index: number) => void;
  unlockNotice: string | null;
  onDismissUnlockNotice: () => void;
  onReviewSubmitted: (review: ReviewDTO) => void;
  isAdmin: boolean;
};

/** Shared place detail body — trails, camps, venues (R3). */
export const PlaceDetailCore = ({
  kind,
  config,
  heroKindSection: HeroKindSection,
  place,
  placeId,
  detailPath,
  activities,
  reviews,
  premium,
  onPremiumChange,
  selectedImage,
  onSelectedImageChange,
  unlockNotice,
  onDismissUnlockNotice,
  onReviewSubmitted,
  isAdmin,
}: PlaceDetailCoreProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const placeTab = parsePlaceDetailTabParam(searchParams.get(PLACE_DETAIL_TAB_QUERY));
  const onPlaceTabChange = (tab: PlaceDetailTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(PLACE_DETAIL_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };

  const pageModel = useMemo(
    () => buildPlaceDetailPageModel({ kind, place, config }),
    [kind, place, config]
  );
  const browsePath = activitiesBrowsePath(config.activityType);
  const accentLink = linkClassForAccent(config.accent);
  const placeDisplayName = resolvePlaceDisplayTitle(place.name, place.tags);
  const placeNameAr =
    readPlaceArabicName(place.tags) ||
    (placeDisplayName !== place.name.trim() ? place.name.trim() : null);
  const heroImage = place.images[0] ?? null;
  const isPendingDraft = place.status === 'draft';

  return (
    <MobileDetailShell
      backTo={detailBackPath(pageModel.backKind)}
      backLabel={config.backLabel}
      banner={
        heroImage ? { src: heroImage, alt: place.name, title: place.name } : undefined
      }
    >
      <div className="min-h-screen bg-ios-bg md:bg-gray-50">
        <PageMeta
          title={place.name}
          description={place.description?.slice(0, 160) ?? `Explore ${place.name} — ${place.region}, UAE`}
          path={detailPath}
          image={place.images?.[0]}
          imageAlt={`${place.name} — ${config.imageAltSuffix}`}
        />
        <JsonLd data={jsonLdForPlace(kind, place)} id={`${kind}-${place.id}`} />
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {isPendingDraft ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold">{CONTRIBUTE_PLACE_PENDING_BANNER_TITLE}</p>
                <p className="mt-1 text-amber-900/90">{CONTRIBUTE_PLACE_PENDING_BANNER_BODY}</p>
                {isAdmin ? (
                  <Link
                    to="/admin/places"
                    className="mt-2 inline-block font-semibold text-amber-950 underline underline-offset-2"
                  >
                    Review in admin
                  </Link>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-center justify-end mb-4 hidden md:flex">
              <ShareButton title={place.name} text={pageModel.shareText} path={detailPath} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="relative mb-4">
                  {heroImage ? (
                    <img
                      src={place.images[selectedImage]}
                      alt={place.name}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex h-96 w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 px-6 text-center text-slate-600">
                      <MapPin className="mb-3 h-10 w-10 text-slate-400" aria-hidden />
                      <p className="font-medium text-slate-700">Map pin only — photos coming soon</p>
                      {place.latitude != null && place.longitude != null && (
                        <p className="mt-1 text-xs text-slate-500">
                          {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 z-10">
                    <ShareButton title={place.name} text={pageModel.shareText} path={detailPath} compact />
                  </div>
                </div>
                {place.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {place.images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onSelectedImageChange(index)}
                        className={`h-20 rounded-lg overflow-hidden ${ringClassForAccent(config.accent, selectedImage === index)}`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className={`mb-4 ${place.difficulty ? 'flex items-start justify-between' : ''}`}>
                  <div>
                    {config.typeBadge ? (
                      <span className="inline-block mb-2 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-semibold">
                        {config.typeBadge}
                      </span>
                    ) : null}
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{placeDisplayName}</h1>
                    {placeNameAr && placeNameAr !== placeDisplayName ? (
                      <p className="mb-2 text-lg text-gray-600 font-arabic" dir="rtl" lang="ar">
                        {placeNameAr}
                      </p>
                    ) : null}
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-1" />
                      <span>{place.region}</span>
                    </div>
                  </div>
                  {place.difficulty ? (
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(place.difficulty)}`}
                    >
                      {capitalize(place.difficulty)}
                    </span>
                  ) : null}
                </div>

                {place.accessibility ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <Car className="w-4 h-4 text-amber-600" />
                    <span className="capitalize">{place.accessibility.replace('-', ' ')}</span>
                  </div>
                ) : null}

                <HeroKindSection place={place} config={config} />

                {pageModel.showSeason ? (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Best Season</h3>
                    <div className="flex gap-2">
                      {place.season!.map((season) => (
                        <span
                          key={season}
                          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${seasonClassForAccent(config.accent)}`}
                        >
                          {season}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <PlaceDetailTabs
              data={toPlaceDetailData(place, config.activityType)}
              accent={config.accent}
              placeId={place.id}
              premium={premium}
              onPremiumChange={onPremiumChange}
              unlockNotice={unlockNotice}
              onDismissUnlockNotice={onDismissUnlockNotice}
              activeTab={placeTab}
              onTabChange={onPlaceTabChange}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">{config.activitiesHeading}</h2>
                <p className="text-gray-600 mt-1">{config.activitiesSubheading}</p>
              </div>
              <Link
                to={browsePath}
                className={`${accentLink} font-medium text-sm inline-flex items-center gap-1.5 group shrink-0`}
              >
                {config.activitiesBrowseLabel}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">{config.emptyActivitiesMessage}</p>
                <Link
                  to={kind === 'event' ? browsePath : myActivitiesPath()}
                  className={`${accentLink} mt-2 inline-block`}
                >
                  {config.emptyActivitiesLinkLabel}
                </Link>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-2">
                {activities.map((activity) => (
                  <ProfileActivityListRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </section>

          <ReviewSection
            targetType="place"
            targetId={placeId}
            reviews={reviews}
            onReviewSubmitted={onReviewSubmitted}
            accent={config.accent === 'emerald' ? undefined : config.accent}
          />
        </div>
      </div>
    </MobileDetailShell>
  );
};
