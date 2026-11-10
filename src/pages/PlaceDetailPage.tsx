import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageMeta } from '../components/seo/PageMeta';
import { PlaceDetailPageShell } from './place/PlaceDetailPageShell';
import { usePlaceDetailCore } from '../hooks/usePlaceDetailPage';
import { canonicalPlaceDetailPath, detailBackPath, placeDetailPath } from '../config/routingCatalog';
import { readDetailBackToFromLocation } from '../explore/mapPeekDetailNavState';
import { parseMobileBackNavState } from '../utils/mobileBackNav';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { PLACE_DETAIL_CONFIG, type PlaceDetailKind } from './placeDetailConfig';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { resolvePlaceConsumerDetailHeaderChrome } from '../place/detail/resolvePlaceConsumerDetailHeaderChrome';
import {
  DETAIL_LOADING_CAMP,
  DETAIL_LOADING_EVENT_VENUE,
  DETAIL_LOADING_TRAIL,
} from '../content/detailLoadingCopy';

const PLACE_LOADING_LABEL: Record<PlaceDetailKind, string> = {
  trail: DETAIL_LOADING_TRAIL,
  camp: DETAIL_LOADING_CAMP,
  event: DETAIL_LOADING_EVENT_VENUE,
};
interface PlaceDetailPageProps {
  kind?: PlaceDetailKind;
}

/** Unified place detail — trails, camps, and event venues share one consumer shell. */
export const PlaceDetailPage = ({ kind: kindProp }: PlaceDetailPageProps) => {
  const { user } = useAuth();
  const placeholderKind: PlaceDetailKind = kindProp ?? 'trail';
  const config = PLACE_DETAIL_CONFIG[placeholderKind];
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailBackTo =
    readDetailBackToFromLocation(location.state) ?? parseMobileBackNavState(location.state)?.from;

  const core = usePlaceDetailCore({
    kind: kindProp,
    placeId: id,
    config,
    searchParams,
    setSearchParams,
  });

  const kind = kindProp ?? core.resolvedKind ?? placeholderKind;
  const activeConfig = PLACE_DETAIL_CONFIG[kind];
  const detailPath = id
    ? kind === 'event'
      ? placeDetailPath('event', id)
      : canonicalPlaceDetailPath(id)
    : undefined;
  const backKind = kind === 'trail' ? 'trail' : kind === 'camp' ? 'camp' : 'event';

  if (core.loading) {
    return (
      <>
        <PageMeta title={activeConfig.loadingTitle} path={detailPath} />
        <ConsumerEntityDetailLoading
          backTo={detailBackTo ?? detailBackPath(backKind)}
          backLabel={parseMobileBackNavState(location.state)?.backLabel ?? 'Explore'}
          headerChrome={resolvePlaceConsumerDetailHeaderChrome(kind)}
          label={PLACE_LOADING_LABEL[kind]}
        />
      </>
    );
  }

  const notFoundTitle = kindProp ? activeConfig.notFoundTitle : 'Place not found';

  if (core.error && !core.loading) {
    return (
      <>
        <PageMeta title="Place unavailable" noIndex path={detailPath} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ConsumerErrorCard message={core.error} onRetry={() => core.reload()} />
          <div className="mt-4 flex justify-center">
            <MobileBackButton
              fallbackTo={detailBackTo ?? detailBackPath(backKind)}
              label={detailBackTo ? 'Browse' : 'Explore'}
            />
          </div>
        </div>
      </>
    );
  }

  if (!core.place || !id) {
    return (
      <>
        <PageMeta title={notFoundTitle} noIndex path={detailPath} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{notFoundTitle}</h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">
            Listed spots are public for signed-out visitors — this usually means the ID is missing
            from your database or the row has no cover image (registry rule). Run catalog seed if you
            are on a fresh dev environment.
          </p>
          <div className="mt-4 flex justify-center">
            <MobileBackButton
              fallbackTo={detailBackTo ?? detailBackPath(backKind)}
              label={detailBackTo ? 'Browse' : 'Explore'}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
        guestPreview={!user}
      />
    </div>
  );
};

/** Canonical route `/place/:id` — infers trail / camp / event from API. */
export const CanonicalPlaceDetailPage = () => <PlaceDetailPage />;

/** Event venue hub — `/venue/:id` stays on this surface (not a `/place` redirect). */
export const VenuePlaceDetailPage = () => <PlaceDetailPage kind="event" />;
