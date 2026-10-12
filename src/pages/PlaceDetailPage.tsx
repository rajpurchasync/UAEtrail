import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageMeta } from '../components/seo/PageMeta';
import { PlaceDetailCore } from '../components/place/PlaceDetailCore';
import { usePlaceDetailCore } from '../components/place/usePlaceDetailCore';
import { detailBackPath } from '../config/routingCatalog';
import { PLACE_DETAIL_CONFIG, type PlaceDetailKind } from './placeDetailConfig';

interface PlaceDetailPageProps {
  kind: PlaceDetailKind;
}

/** Unified place detail — trails, camps, and event venues share one page shell. */
export const PlaceDetailPage = ({ kind }: PlaceDetailPageProps) => {
  const config = PLACE_DETAIL_CONFIG[kind];
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const core = usePlaceDetailCore({
    kind,
    placeId: id,
    config,
    searchParams,
    setSearchParams,
  });

  const detailPath = id ? `${config.pathPrefix}/${id}` : undefined;
  const backKind = kind === 'trail' ? 'trail' : kind === 'camp' ? 'camp' : 'event';

  if (core.loading) {
    return (
      <>
        <PageMeta title={config.loadingTitle} path={detailPath} />
        <div className="min-h-screen flex items-center justify-center">
          <div
            className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${config.spinnerBorderClass}`}
          />
        </div>
      </>
    );
  }

  if (!core.place || !id) {
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

  return (
    <PlaceDetailCore
      kind={kind}
      config={config}
      place={core.place}
      placeId={id}
      detailPath={detailPath!}
      activities={core.activities}
      reviews={core.reviews}
      premium={core.premium}
      onPremiumChange={core.setPremium}
      selectedImage={core.selectedImage}
      onSelectedImageChange={core.setSelectedImage}
      unlockNotice={core.unlockNotice}
      onDismissUnlockNotice={() => core.setUnlockNotice(null)}
      onReviewSubmitted={(review) => core.setReviews((prev) => [review, ...prev])}
      isAdmin={user?.role === 'platform_admin'}
    />
  );
};
