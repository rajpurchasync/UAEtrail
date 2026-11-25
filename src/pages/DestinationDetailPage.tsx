import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  destinationAvailabilityQueryKey,
  destinationDetailQueryKey,
} from '../hooks/clientQueryKeys';
import { fetchDestinationDetailBySlug } from '../hooks/destinationHubClientApi';
import { fetchExplorePeopleAvailability } from '../hooks/memberPeopleClientApi';
import { detailBackPath, EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { PRODUCT_EXPLORE_CTA } from '../content/productNorthStar';
import { DetailPageShell } from '../detail/shared/DetailPageShell';
import { DestinationDetailView } from '../components/destination/DestinationDetailView';
import { DestinationDetailPageShell } from './destination/DestinationDetailPageShell';
import { resolveDestinationConsumerDetailHeaderChrome } from '../destinationDetail/detail/resolveDestinationConsumerDetailHeaderChrome';
import {
  DESTINATION_DETAIL_TAB_QUERY,
  parseDestinationDetailTabParam,
  type DestinationDetailTabId,
} from '../destinationDetail/destinationDetailTab';
import { DETAIL_LOADING_AREA } from '../content/detailLoadingCopy';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { readDetailBackToFromLocation } from '../explore/mapPeekDetailNavState';
import { parseMobileBackNavState } from '../utils/mobileBackNav';

/** Curated destination hub — tabbed shell + explore deep links (MIG-DESTINATION-GEO). */
export const DestinationDetailPage = () => {
  const location = useLocation();
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseDestinationDetailTabParam(searchParams.get(DESTINATION_DETAIL_TAB_QUERY));

  const onTabChange = (tab: DestinationDetailTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(DESTINATION_DETAIL_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };

  const weekRange = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 7);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: destinationDetailQueryKey(slug),
    queryFn: () => fetchDestinationDetailBySlug(slug),
    enabled: Boolean(slug),
  });

  const { data: availabilityIndex } = useQuery({
    queryKey: destinationAvailabilityQueryKey(slug, weekRange.from),
    queryFn: async () => {
      return fetchExplorePeopleAvailability({
        from: weekRange.from,
        to: weekRange.to,
        area: slug,
      });
    },
    enabled: Boolean(slug),
  });

  const shellBack = detailBackPath('explore');
  const headerChrome = resolveDestinationConsumerDetailHeaderChrome();

  if (!slug) {
    return (
      <DestinationDetailPageShell>
        <DetailPageShell backTo={shellBack} backLabel="Explore" headerChrome={headerChrome}>
          <main className="mx-auto max-w-lg px-4 py-10">
            <p className="text-slate-600">Missing destination.</p>
            <Link to={EXPLORE_MAP_PATH} className="mt-4 inline-block font-semibold text-emerald-800">
              Back to map
            </Link>
          </main>
        </DetailPageShell>
      </DestinationDetailPageShell>
    );
  }

  if (isLoading) {
    return (
      <ConsumerEntityDetailLoading
        backTo={readDetailBackToFromLocation(location.state) ?? shellBack}
        backLabel={parseMobileBackNavState(location.state)?.backLabel ?? 'Explore'}
        headerChrome={headerChrome}
        label={DETAIL_LOADING_AREA}
      />
    );
  }

  if (isError || !data) {
    return (
      <DestinationDetailPageShell>
        <DetailPageShell backTo={shellBack} backLabel="Explore" headerChrome={headerChrome}>
          <main className="mx-auto max-w-lg px-4 py-10">
            <p className="text-slate-600">We could not find this destination.</p>
            <Link to={EXPLORE_MAP_PATH} className="mt-4 inline-block font-semibold text-emerald-800">
              {PRODUCT_EXPLORE_CTA}
            </Link>
          </main>
        </DetailPageShell>
      </DestinationDetailPageShell>
    );
  }

  return (
    <DestinationDetailPageShell>
      <DestinationDetailView
        slug={slug}
        data={data}
        availabilityIndex={availabilityIndex}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </DestinationDetailPageShell>
  );
};

export default DestinationDetailPage;