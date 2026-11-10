import { Link, useLocation, useParams } from 'react-router-dom';
import { FacilityConsumerDetailPage } from '../facility/detail/templates/FacilityConsumerDetailPage';
import { PageMeta } from '../components/seo/PageMeta';
import { facilityDetailPath, detailBackPath } from '../config/routingCatalog';
import { usePublicFacilityDetail } from '../hooks/usePublicFacilityDetail';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { parseMobileBackNavState } from '../utils/mobileBackNav';
import { resolveFacilityConsumerDetailHeaderChrome } from '../facility/detail/resolveFacilityConsumerDetailHeaderChrome';
import { DETAIL_LOADING_FACILITY } from '../content/detailLoadingCopy';
import { APP_PAGE_MIN_H_CLASS } from '../config/layoutScroll';

export const FacilityDetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { facility, loading } = usePublicFacilityDetail(id);

  const detailPath = id ? facilityDetailPath(id) : undefined;

  if (loading) {
    return (
      <>
        <PageMeta title="Loading facility" path={detailPath} />
        <ConsumerEntityDetailLoading
          backTo={detailBackPath('explore')}
          backLabel={parseMobileBackNavState(location.state)?.backLabel ?? 'Explore'}
          headerChrome={resolveFacilityConsumerDetailHeaderChrome('toilet')}
          label={DETAIL_LOADING_FACILITY}
        />
      </>
    );
  }

  if (!facility || !id) {
    return (
      <>
        <PageMeta title="Facility not found" noIndex path={detailPath} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Facility not found</h1>
          <Link to={detailBackPath('event')} className="text-violet-700 mt-4 inline-block">
            Back to map
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className={`${APP_PAGE_MIN_H_CLASS} flex h-full min-h-0 flex-1 flex-col overflow-hidden`}>
      <FacilityConsumerDetailPage facility={facility} facilityId={id} />
    </div>
  );
};
