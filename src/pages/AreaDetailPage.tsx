import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { areaDetailQueryKey, areaAvailabilityQueryKey } from '../hooks/clientQueryKeys';
import { fetchAreaDetailBySlug } from '../hooks/areaHubClientApi';
import { fetchExplorePeopleAvailability } from '../hooks/memberPeopleClientApi';
import { detailBackPath, EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { PRODUCT_EXPLORE_CTA } from '../content/productNorthStar';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { AreaDetailView } from '../components/area/AreaDetailView';
import {
  AREA_DETAIL_TAB_QUERY,
  parseAreaDetailTabParam,
  type AreaDetailTabId,
} from '../area/areaDetailTab';

/** Curated area hub — tabbed shell + explore deep links (S9 Phase 4). */
export const AreaDetailPage = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseAreaDetailTabParam(searchParams.get(AREA_DETAIL_TAB_QUERY));

  const onTabChange = (tab: AreaDetailTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(AREA_DETAIL_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };

  const weekRange = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 7);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: areaDetailQueryKey(slug),
    queryFn: () => fetchAreaDetailBySlug(slug),
    enabled: Boolean(slug),
  });

  const { data: availabilityIndex } = useQuery({
    queryKey: areaAvailabilityQueryKey(slug, weekRange.from),
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

  if (!slug) {
    return (
      <MobileDetailShell backTo={shellBack} backLabel="Explore">
        <main className="mx-auto max-w-lg px-4 py-10">
          <p className="text-slate-600">Missing area.</p>
          <Link to={EXPLORE_MAP_PATH} className="mt-4 inline-block font-semibold text-emerald-800">
            Back to map
          </Link>
        </main>
      </MobileDetailShell>
    );
  }

  if (isLoading) {
    return (
      <MobileDetailShell backTo={shellBack} backLabel="Explore">
        <main className="mx-auto max-w-lg px-4 py-10">
          <p className="text-slate-600">Loading area…</p>
        </main>
      </MobileDetailShell>
    );
  }

  if (isError || !data) {
    return (
      <MobileDetailShell backTo={shellBack} backLabel="Explore">
        <main className="mx-auto max-w-lg px-4 py-10">
          <p className="text-slate-600">We could not find this area.</p>
          <Link to={EXPLORE_MAP_PATH} className="mt-4 inline-block font-semibold text-emerald-800">
            {PRODUCT_EXPLORE_CTA}
          </Link>
        </main>
      </MobileDetailShell>
    );
  }

  return (
    <AreaDetailView
      slug={slug}
      data={data}
      availabilityIndex={availabilityIndex}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
};

export default AreaDetailPage;
