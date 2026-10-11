import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { areaDetailPath } from '@uaetrail/shared-types';
import { areasApi } from '../api/domains/areas';
import { api } from '../api/index';
import { explorePath } from '../explore/routing';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { PRODUCT_EXPLORE_CTA } from '../content/productNorthStar';
import { AreaHubPreviewSections } from '../components/area/AreaHubPreviewSections';

/** Curated area hub — links into explore with `?area=` filter (Phase 4). */
export const AreaDetailPage = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const weekRange = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 7);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['area', slug],
    queryFn: async () => {
      const res = await areasApi.getAreaBySlug(slug);
      return res.data;
    },
    enabled: Boolean(slug),
  });

  const { data: availabilityIndex } = useQuery({
    queryKey: ['area-availability', slug, weekRange.from],
    queryFn: async () => {
      const res = await api.explorePeopleAvailability({
        from: weekRange.from,
        to: weekRange.to,
        area: slug,
      });
      return res.data;
    },
    enabled: Boolean(slug),
  });

  if (!slug) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-slate-600">Missing area.</p>
        <Link to={EXPLORE_MAP_PATH} className="mt-4 inline-block font-semibold text-emerald-800">
          Back to map
        </Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-slate-600">Loading area…</p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-slate-600">We could not find this area.</p>
        <Link to={EXPLORE_MAP_PATH} className="mt-4 inline-block font-semibold text-emerald-800">
          {PRODUCT_EXPLORE_CTA}
        </Link>
      </main>
    );
  }

  const { area, counts, preview } = data;
  const exploreInArea = explorePath({ list: true, area: area.slug });

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {area.imageUrl ? (
        <img
          src={area.imageUrl}
          alt=""
          className="-mx-4 mb-6 w-[calc(100%+2rem)] max-w-none rounded-2xl object-cover aspect-[16/9]"
        />
      ) : null}
      <p className="text-sm font-medium text-emerald-800">{area.region}</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">{area.name}</h1>
      <p className="mt-3 text-slate-600">
        {area.summary?.trim() ||
          'Outings, trails, and people looking for crew in this zone — filter the map to what is happening here.'}
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-slate-50 px-3 py-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Activities</dt>
          <dd className="text-2xl font-semibold text-slate-900">{counts.activities}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Places</dt>
          <dd className="text-2xl font-semibold text-slate-900">{counts.places}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Seeking</dt>
          <dd className="text-2xl font-semibold text-slate-900">{counts.seeking}</dd>
        </div>
      </dl>

      <AreaHubPreviewSections
        areaSlug={area.slug}
        activities={preview?.activities ?? []}
        places={preview?.places ?? []}
      />

      {availabilityIndex && availabilityIndex.people.length > 0 ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Available this week</h2>
          <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
            {availabilityIndex.people.slice(0, 8).map((person) => (
              <li key={person.userId} className="px-4 py-3 text-sm text-slate-800">
                {person.displayName} · {person.kinds.join(', ')}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        to={exploreInArea}
        className="mt-8 flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white shadow-sm"
      >
        See on the map
      </Link>

      <p className="mt-4 text-center text-xs text-slate-500">
        Canonical path: {areaDetailPath(area.slug)}
      </p>
    </main>
  );
};

export default AreaDetailPage;
