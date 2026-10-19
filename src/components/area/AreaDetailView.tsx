import { Link } from 'react-router-dom';
import type { AreaDetailPayload } from '../../hooks/areaHubClientApi';
import type { ExploreAvailabilityIndex } from '../../hooks/memberPeopleClientApi';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import { ConsumerEntityTabBar } from '../mobile/ConsumerEntityTabBar';
import { PageMeta } from '../seo/PageMeta';
import { explorePath } from '../../explore/routing';
import { hostCompose, seekFixedCompose } from '../../explore/compose';
import { areaDetailPath } from '@uaetrail/shared-types';
import {
  AREA_DETAIL_TAB_LABELS,
  AREA_DETAIL_TABS,
  type AreaDetailTabId,
} from '../../area/areaDetailTab';
import { AreaHubMapStrip } from './AreaHubMapStrip';
import { AreaHubPreviewSections } from './AreaHubPreviewSections';
import { Compass, LayoutGrid, MapPin } from 'lucide-react';

const AREA_TAB_ICONS = {
  overview: LayoutGrid,
  places: MapPin,
  activities: Compass,
} as const;

type AreaDetailViewProps = {
  slug: string;
  data: AreaDetailPayload;
  availabilityIndex?: ExploreAvailabilityIndex | null;
  activeTab: AreaDetailTabId;
  onTabChange: (tab: AreaDetailTabId) => void;
};

export const AreaDetailView = ({
  slug,
  data,
  availabilityIndex,
  activeTab,
  onTabChange,
}: AreaDetailViewProps) => {
  const { area, counts, preview } = data;
  const backTo = explorePath({ area: slug });
  const summary =
    area.summary?.trim() ||
    'Outings, trails, and people looking for crew in this zone — filter the map to what is happening here.';
  const detailPath = areaDetailPath(area.slug);

  const mobileTabs = AREA_DETAIL_TABS.map((id) => ({
    id,
    label: AREA_DETAIL_TAB_LABELS[id],
    icon: AREA_TAB_ICONS[id],
  }));

  return (
    <MobileDetailShell
      backTo={backTo}
      backLabel="Explore"
      banner={
        area.imageUrl
          ? {
              src: area.imageUrl,
              alt: area.name,
              title: area.name,
              eyebrow: area.region,
              linkTo: backTo,
            }
          : undefined
      }
    >
      <PageMeta title={area.name} description={summary.slice(0, 160)} path={detailPath} image={area.imageUrl} />
      <div className="consumer-bg md:bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-lg px-4 pb-10 md:max-w-3xl md:px-6">
          <div className="hidden md:block pt-6">
            {area.imageUrl ? (
              <img
                src={area.imageUrl}
                alt=""
                className="mb-6 w-full rounded-2xl object-cover aspect-[16/9]"
              />
            ) : null}
            <p className="text-sm font-medium text-emerald-800">{area.region}</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{area.name}</h1>
            <p className="mt-3 text-slate-600">{summary}</p>
          </div>

          <div className="md:hidden pt-3 pb-1">
            {!area.imageUrl ? (
              <h1 className="text-2xl font-bold text-slate-900">{area.name}</h1>
            ) : null}
            <p className="text-sm font-medium text-emerald-800 mt-1">{area.region}</p>
            <p className="mt-1 text-base text-slate-600 line-clamp-3">{summary}</p>
          </div>

          <ConsumerEntityTabBar
            tabs={mobileTabs}
            active={activeTab}
            onChange={onTabChange}
            ariaLabel="Area sections"
            className="-mx-4 sm:mx-0 mt-4"
          />

          <div className="hidden md:flex border-b mt-6 gap-6">
            {AREA_DETAIL_TABS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {AREA_DETAIL_TAB_LABELS[id]}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="mt-6 space-y-6">
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/80 px-3 py-4 shadow-sm border border-white/60">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Activities</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{counts.activities}</dd>
                </div>
                <div className="rounded-2xl bg-white/80 px-3 py-4 shadow-sm border border-white/60">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Places</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{counts.places}</dd>
                </div>
                <div className="rounded-2xl bg-white/80 px-3 py-4 shadow-sm border border-white/60">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Seeking</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{counts.seeking}</dd>
                </div>
              </dl>

              <AreaHubMapStrip
                areaSlug={area.slug}
                areaName={area.name}
                center={area.center}
                boundsRing={area.bounds}
                places={preview?.places ?? []}
              />

              <section className="flex flex-wrap gap-2">
                <Link
                  to={explorePath({
                    area: area.slug,
                    compose: seekFixedCompose('hiking'),
                  })}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
                >
                  Find crew
                </Link>
                <Link
                  to={explorePath({
                    area: area.slug,
                    compose: hostCompose('hiking'),
                  })}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Host an outing
                </Link>
              </section>

              {availabilityIndex && availabilityIndex.people.length > 0 ? (
                <section className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">Available this week</h2>
                  <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
                    {availabilityIndex.people.slice(0, 8).map((person) => (
                      <li key={person.userId} className="px-4 py-3 text-sm text-slate-800">
                        {person.displayName} · {person.kinds.join(', ')}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={explorePath({ peopleBrowse: true, area: area.slug, list: true })}
                    className="text-sm font-semibold text-emerald-800"
                  >
                    Browse people on the map
                  </Link>
                </section>
              ) : null}
            </div>
          )}

          {activeTab === 'activities' && (
            <AreaHubPreviewSections
              areaSlug={area.slug}
              activities={preview?.activities ?? []}
              places={preview?.places ?? []}
              operators={preview?.operators ?? []}
              mode="activities"
            />
          )}

          {activeTab === 'places' && (
            <AreaHubPreviewSections
              areaSlug={area.slug}
              activities={preview?.activities ?? []}
              places={preview?.places ?? []}
              operators={preview?.operators ?? []}
              mode="places"
            />
          )}
        </div>
      </div>
    </MobileDetailShell>
  );
};
