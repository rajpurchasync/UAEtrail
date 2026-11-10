import { useEffect, useState } from 'react';
import type { GeoCountsDTO, GeoNodeLite } from '@uaetrail/shared-types';
import { geoCountryPath, geoNodePath } from '../config/routingCatalog';
import { GEO_CATALOG_PAGE_SIZE } from '../api/domains/geoHierarchy';
import { GeoCountChips, geoCountChips } from './GeoCountChips';
import { geoKindLabel } from './geoKindLabel';
import { GeoKindMark } from './GeoItemMark';
import { GeoGuestDrillLink } from './GeoGuestDrillLink';

type GeoChild = GeoNodeLite & { counts?: GeoCountsDTO };

export const geoChildHref = (node: GeoNodeLite): string =>
  node.kind === 'country' && node.iso ? geoCountryPath(node.iso) : geoNodePath(node.id);

export const GeoChildCards = ({
  nodes,
  heading,
  linkState,
  showCounts = true,
  pageSize = GEO_CATALOG_PAGE_SIZE,
}: {
  nodes: GeoChild[];
  heading: string;
  linkState?: object;
  /** Hide rollup counts for guests (aggregation preview only). */
  showCounts?: boolean;
  pageSize?: number;
}) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [nodes, pageSize]);

  if (nodes.length === 0) return null;

  const visible = nodes.slice(0, visibleCount);
  const hasMore = nodes.length > visibleCount;

  return (
    <section className="space-y-2 md:space-y-1.5">
      <h2 className="text-base font-semibold text-slate-900 md:text-[0.9375rem]">{heading}</h2>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4">
        {visible.map((child) => {
          const href = geoChildHref(child);
          const rowClass =
            'flex h-full min-h-10 min-w-0 items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm hover:border-emerald-200 md:gap-2 md:p-2 dark:border-neutral-700 dark:bg-neutral-900';
          return (
            <li key={child.id}>
              <GeoGuestDrillLink to={href} state={linkState} authReturnPath={href} className={rowClass}>
                <GeoKindMark kind={child.kind} />
                <span className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                    {geoKindLabel(child.kind)}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere] md:text-[0.9375rem]">
                    {child.n}
                  </span>
                  {showCounts && geoCountChips(child.counts).length > 0 ? (
                    <span className="mt-1.5 block md:mt-1">
                      <GeoCountChips counts={child.counts} />
                    </span>
                  ) : null}
                </span>
              </GeoGuestDrillLink>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + pageSize, nodes.length))}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-emerald-200"
          >
            Load more
          </button>
        </div>
      ) : null}
    </section>
  );
};
