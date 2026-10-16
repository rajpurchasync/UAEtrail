import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageMeta } from '../components/seo/PageMeta';
import { PlaceDetailPageShell } from './place/PlaceDetailPageShell';
import { usePlaceDetailCore } from '../components/place/usePlaceDetailCore';
import { canonicalPlaceDetailPath, detailBackPath } from '../config/routingCatalog';
import { PLACE_DETAIL_CONFIG, type PlaceDetailKind } from './placeDetailConfig';
interface PlaceDetailPageProps {
  kind?: PlaceDetailKind;
}

/** Unified place detail — trails, camps, and event venues share one consumer shell. */
export const PlaceDetailPage = ({ kind: kindProp }: PlaceDetailPageProps) => {
  const placeholderKind: PlaceDetailKind = kindProp ?? 'trail';
  const config = PLACE_DETAIL_CONFIG[placeholderKind];
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const core = usePlaceDetailCore({
    kind: kindProp,
    placeId: id,
    config,
    searchParams,
    setSearchParams,
  });

  const kind = kindProp ?? core.resolvedKind ?? placeholderKind;
  const activeConfig = PLACE_DETAIL_CONFIG[kind];
  const detailPath = id ? canonicalPlaceDetailPath(id) : undefined;
  const backKind = kind === 'trail' ? 'trail' : kind === 'camp' ? 'camp' : 'event';

  if (core.loading) {
    return (
      <>
        <PageMeta title={activeConfig.loadingTitle} path={detailPath} />
        <div className="min-h-screen flex items-center justify-center">
          <div
            className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${activeConfig.spinnerBorderClass}`}
          />
        </div>
      </>
    );
  }

  if (!core.place || !id) {
    return (
      <>
        <PageMeta title={activeConfig.notFoundTitle} noIndex path={detailPath} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{activeConfig.notFoundTitle}</h1>
          <Link to={detailBackPath(backKind)} className={`${activeConfig.notFoundLinkClass} mt-4 inline-block`}>
            Back to map
          </Link>
        </div>
      </>
    );
  }

  return (
    <PlaceDetailPageShell
      kind={kind}
      config={activeConfig}
      place={core.place}
      placeId={id}
      detailPath={detailPath!}
      activities={core.activities}
      reviews={core.reviews}
      onReviewSubmitted={(review) => core.setReviews((prev) => [review, ...prev])}
      nearbyFacilities={core.nearbyFacilities}
      premium={core.premium}
      onPremiumChange={core.setPremium}
      unlockNotice={core.unlockNotice}
      onDismissUnlockNotice={() => core.setUnlockNotice(null)}
    />
  );
};

/** Canonical route `/place/:id` — infers trail / camp / event from API. */
export const CanonicalPlaceDetailPage = () => <PlaceDetailPage />;
