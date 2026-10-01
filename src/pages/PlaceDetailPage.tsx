import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, TrendingUp, Clock, Mountain, Baby, Car, ChevronRight } from 'lucide-react';
import { ReviewDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import {
  ShareButton,
  PlaceDetailTabs,
  toPlaceDetailData,
  ReviewSection,
} from '../components/ui';
import { ProfileActivityListRow } from '../components/profile/ProfileActivityListRow';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { placeSchema } from '../components/seo/schemas';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { getDifficultyColor, capitalize } from '../utils';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { Place } from '../types/place';
import { fetchPlaceDetail } from '../api/public';
import { api } from '../api/index';
import { activitiesBrowsePath } from '../config/activityTypes';
import { detailBackPath, myActivitiesPath } from '../utils/exploreRouting';
import { hasPositiveNumber, isDefaultVenueSeason } from '../utils/venueDetailDisplay';
import { PLACE_DETAIL_CONFIG, type PlaceDetailKind, type PlaceDetailKindConfig } from './placeDetailConfig';
import { readPlaceArabicName, resolvePlaceDisplayTitle } from '../utils/venueDetailDisplay';
import {
  CONTRIBUTE_PLACE_PENDING_BANNER_BODY,
  CONTRIBUTE_PLACE_PENDING_BANNER_TITLE,
} from '../explore/createFlowCopy';

const jsonLdForPlace = (_kind: PlaceDetailKind, place: Place) => placeSchema(place);

const ringClassForAccent = (accent: PlaceDetailKindConfig['accent'], selected: boolean): string => {
  const map = {
    emerald: selected ? 'ring-emerald-600' : '',
    amber: selected ? 'ring-amber-600' : '',
    violet: selected ? 'ring-violet-600' : '',
  } as const;
  return map[accent];
};

const seasonClassForAccent = (accent: PlaceDetailKindConfig['accent']): string => {
  const map = {
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    violet: 'bg-violet-100 text-violet-800',
  } as const;
  return map[accent];
};

const linkClassForAccent = (accent: PlaceDetailKindConfig['accent']): string => {
  const map = {
    emerald: 'text-emerald-600 hover:text-emerald-700',
    amber: 'text-amber-600 hover:text-amber-700',
    violet: 'text-violet-600 hover:text-violet-700',
  } as const;
  return map[accent];
};

interface PlaceDetailPageProps {
  kind: PlaceDetailKind;
}

/** Unified place detail — trails, camps, and event venues share one page shell. */
export const PlaceDetailPage = ({ kind }: PlaceDetailPageProps) => {
  const config = PLACE_DETAIL_CONFIG[kind];
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [premium, setPremium] = useState<LocationPremiumSummaryDTO | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  const detailPath = id ? `${config.pathPrefix}/${id}` : undefined;
  const backKind = kind === 'trail' ? 'trail' : kind === 'camp' ? 'camp' : 'event';

  useEffect(() => {
    if (!id) return;
    api.trackPlaceView(id).catch(() => undefined);
    setLoading(true);
    Promise.all([
      fetchPlaceDetail(id),
      api.getPlaceActivities(id).catch(() => ({ data: [] })),
      api.getPlaceReviews(id!).catch(() => ({ data: [] })),
    ])
      .then(([placeResult, eventsRes, reviewsRes]) => {
        const loaded = placeResult.place?.activityType === config.activityType ? placeResult.place : null;
        setPlace(loaded);
        setPremium(placeResult.premium ?? null);
        setActivities(eventsRes.data);
        setReviews(reviewsRes.data);
      })
      .catch(() => setPlace(null))
      .finally(() => setLoading(false));
  }, [id, kind, config.activityType]);

  useEffect(() => {
    if (!id) return;
    const unlock = searchParams.get('unlock');
    if (!unlock) return;

    const next = new URLSearchParams(searchParams);
    next.delete('unlock');
    setSearchParams(next, { replace: true });

    if (unlock === 'success') {
      setUnlockNotice('Premium guide unlocked. Your route map and guide are ready below.');
      fetchPlaceDetail(id)
        .then((result) => {
          if (result.premium) setPremium(result.premium);
        })
        .catch(() => undefined);
      return;
    }

    if (unlock === 'cancelled') {
      setUnlockNotice('Checkout cancelled. You can unlock anytime from the Guided information tab.');
    }
  }, [id, searchParams, setSearchParams]);

  if (loading) {
    return (
      <>
        <PageMeta title={config.loadingTitle} path={detailPath} />
        <div className="min-h-screen flex items-center justify-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${config.spinnerBorderClass}`} />
        </div>
      </>
    );
  }

  if (!place) {
    return (
      <>
        <PageMeta title={config.notFoundTitle} noIndex path={detailPath} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{config.notFoundTitle}</h1>
          <Link to={detailBackPath(backKind)} className={`${config.notFoundLinkClass} mt-4 inline-block`}>
            Back to map
          </Link>
        </div>
      </>
    );
  }

  const shareText =
    kind === 'trail' && hasPositiveNumber(place.distance)
      ? `${place.region} · ${place.distance} km trail on UAE Trails`
      : `${place.region} · ${config.shareSuffix}`;
  const showSeason = place.season && !isDefaultVenueSeason(place.season);
  const showTrailStats =
    kind === 'trail' &&
    (hasPositiveNumber(place.distance) ||
      hasPositiveNumber(place.duration) ||
      hasPositiveNumber(place.elevation) ||
      place.childFriendly);
  const browsePath = activitiesBrowsePath(config.activityType);
  const accentLink = linkClassForAccent(config.accent);
  const placeDisplayName = resolvePlaceDisplayTitle(place.name, place.tags);
  const placeNameAr =
    readPlaceArabicName(place.tags) ||
    (placeDisplayName !== place.name.trim() ? place.name.trim() : null);
  const heroImage = place.images[0] ?? null;
  const isPendingDraft = place.status === 'draft';
  const isAdmin = user?.role === 'platform_admin';

  return (
    <MobileDetailShell
      backTo={detailBackPath(backKind)}
      backLabel={config.backLabel}
      banner={
        heroImage
          ? { src: heroImage, alt: place.name, title: place.name }
          : undefined
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
                  <Link to="/admin/places" className="mt-2 inline-block font-semibold text-amber-950 underline underline-offset-2">
                    Review in admin
                  </Link>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-center justify-end mb-4 hidden md:flex">
              <ShareButton title={place.name} text={shareText} path={detailPath!} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="relative mb-4">
                  {heroImage ? (
                  <img src={place.images[selectedImage]} alt={place.name} className="w-full h-96 object-cover rounded-lg" />
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
                    <ShareButton title={place.name} text={shareText} path={detailPath!} compact />
                  </div>
                </div>
                {place.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {place.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
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
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(place.difficulty)}`}>
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

                {showTrailStats ? (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {hasPositiveNumber(place.distance) ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          <span className="text-sm">Distance</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{place.distance} km</div>
                      </div>
                    ) : null}
                    {hasPositiveNumber(place.duration) ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <Clock className="w-5 h-5 mr-2" />
                          <span className="text-sm">Duration</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{place.duration} hrs</div>
                      </div>
                    ) : null}
                    {hasPositiveNumber(place.elevation) ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <Mountain className="w-5 h-5 mr-2" />
                          <span className="text-sm">Elevation</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{place.elevation} m</div>
                      </div>
                    ) : null}
                    {place.childFriendly ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <Baby className="w-5 h-5 mr-2" />
                          <span className="text-sm">Family</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">Kid-friendly</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {showSeason ? (
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
              onPremiumChange={setPremium}
              unlockNotice={unlockNotice}
              onDismissUnlockNotice={() => setUnlockNotice(null)}
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
              <Link to={browsePath} className={`${accentLink} font-medium text-sm inline-flex items-center gap-1.5 group shrink-0`}>
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
            targetId={id!}
            reviews={reviews}
            onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
            accent={config.accent === 'emerald' ? undefined : config.accent}
          />
        </div>
      </div>
    </MobileDetailShell>
  );
};
