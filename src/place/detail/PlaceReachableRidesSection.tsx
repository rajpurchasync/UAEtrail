import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlaceReachableRideRowDTO } from '@uaetrail/shared-types';
import { formatExploreEventDateLabel } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { ActivityHubListRow } from '../../components/mobile/ActivityHubListRow';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import { AsyncLoadingState } from '../../components/ui/AsyncLoadingState';
import { LOADING_NEARBY_RIDES } from '../../content/detailLoadingCopy';

const PAGE_SIZE = 10;

const formatRideRowMeta = (row: PlaceReachableRideRowDTO): string => {
  const activity = row.activity;
  const datePart = formatExploreEventDateLabel(activity.date) ?? activity.date;
  const parts: string[] = [];
  if (activity.locationName?.trim()) parts.push(activity.locationName.trim());
  parts.push(datePart);
  if (activity.time?.trim()) parts.push(activity.time.trim());
  return parts.join(' · ');
};

const distanceChip = (km: number | null) => {
  if (km == null) return null;
  const label = km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`;
  return (
    <span className="shrink-0 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-indigo-900 ring-1 ring-indigo-200">
      {label}
    </span>
  );
};

type PlaceReachableRidesSectionProps = {
  placeId: string;
};

export const PlaceReachableRidesSection = ({ placeId }: PlaceReachableRidesSectionProps) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PlaceReachableRideRowDTO[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(false);
    setLoading(true);
    let cancelled = false;
    void api
      .getPlaceReachableRides(placeId, 1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
        setHasMore(res.meta?.hasMore ?? false);
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        void api
          .getPlaceReachableRides(placeId, nextPage, PAGE_SIZE)
          .then((res) => {
            setRows((prev) => [...prev, ...(res.data ?? [])]);
            setHasMore(res.meta?.hasMore ?? false);
            setPage(nextPage);
          })
          .catch(() => setHasMore(false))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: '120px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, placeId]);

  const sectionProps = {
    id: 'place-detail-rides' as const,
    title: 'Rides reaching this area' as const,
    tone: 'indigo' as const,
    ariaLabel: 'Rides reaching this area',
    collapsible: true,
    defaultExpanded: false,
  };

  if (loading) {
    return (
      <ConsumerDetailSection {...sectionProps}>
        <AsyncLoadingState variant="section" label={LOADING_NEARBY_RIDES} rows={2} />
      </ConsumerDetailSection>
    );
  }

  if (rows.length === 0) {
    return (
      <ConsumerDetailSection {...sectionProps}>
        <p className="text-sm text-neutral-700 lg:text-[13px]">
          No published rides listed for this place yet. Check the map for rideshare pins nearby.
        </p>
      </ConsumerDetailSection>
    );
  }

  return (
    <ConsumerDetailSection {...sectionProps} defaultExpanded>
      <ul className="divide-y divide-indigo-100/80 rounded-lg border border-indigo-100/80 bg-white/70">
        {rows.map((row) => (
          <li key={row.activity.id}>
            <ActivityHubListRow
              title={row.activity.title?.trim() || 'Rideshare'}
              meta={formatRideRowMeta(row)}
              badge={distanceChip(row.distanceKmFromPlace)}
              onClick={() => navigate(`/activity/${row.activity.id}`)}
            />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div ref={sentinelRef} className="mt-2 h-6 text-center text-xs text-indigo-800/70" aria-live="polite">
          {loadingMore ? 'Loading more…' : ''}
        </div>
      ) : null}
    </ConsumerDetailSection>
  );
};
