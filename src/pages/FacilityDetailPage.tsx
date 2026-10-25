import { Link, useParams } from 'react-router-dom';
import { FacilityConsumerDetailPage } from '../facility/detail/templates/FacilityConsumerDetailPage';
import { PageMeta } from '../components/seo/PageMeta';
import { facilityDetailPath, detailBackPath } from '../config/routingCatalog';
import { usePublicFacilityDetail } from '../hooks/usePublicFacilityDetail';
import { DetailPageLoadingState } from '../components/ui/DetailPageLoadingState';
import { DETAIL_LOADING_FACILITY } from '../content/detailLoadingCopy';

export const FacilityDetailPage = () => {
  const { id } = useParams();
  const { facility, loading } = usePublicFacilityDetail(id);

  const detailPath = id ? facilityDetailPath(id) : undefined;

  if (loading) {
    return (
      <>
        <PageMeta title="Loading facility" path={detailPath} />
        <DetailPageLoadingState label={DETAIL_LOADING_FACILITY} accent="violet" variant="page" />
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

  return <FacilityConsumerDetailPage facility={facility} facilityId={id} />;
};
