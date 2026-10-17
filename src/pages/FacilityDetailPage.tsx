import { Link, useParams } from 'react-router-dom';
import { FacilityConsumerDetailPage } from '../facility/detail/templates/FacilityConsumerDetailPage';
import { PageMeta } from '../components/seo/PageMeta';
import { facilityDetailPath, detailBackPath } from '../config/routingCatalog';
import { usePublicFacilityDetail } from '../hooks/usePublicFacilityDetail';

export const FacilityDetailPage = () => {
  const { id } = useParams();
  const { facility, loading } = usePublicFacilityDetail(id);

  const detailPath = id ? facilityDetailPath(id) : undefined;

  if (loading) {
    return (
      <>
        <PageMeta title="Loading facility" path={detailPath} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600" />
        </div>
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
