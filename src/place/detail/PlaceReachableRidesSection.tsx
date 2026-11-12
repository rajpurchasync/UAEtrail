import { useEffect, useRef, useState } from 'react';
import type { PlaceReachableRideRowDTO } from '@uaetrail/shared-types';
import { formatExploreEventDateLabel } from '@uaetrail/shared-types';
import { fetchPlaceReachableRides } from '../../hooks/placeDetailClientApi';
import { ActivityLinkedRideshareAffordance } from '../../components/activity/ActivityLinkedRideshareAffordance';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import { AsyncLoadingState } from '../../components/ui/AsyncLoadingState';
import { LOADING_NEARBY_RIDES } from '../../content/detailLoadingCopy';
import type { ActivityLinkagePlanSummary } from '../../activity/resolveActivityLinkageSummaries';

const PAGE_SIZE = 10;

const toSummary = (row: PlaceReachableRideRowDTO): ActivityLinkagePlanSummary => {
  const activity = row.activity;
  const datePart = formatExploreEventDateLabel(activity.date) ?? activity.date;
  const distance =
    row.distanceKmFromPlace == null
      ? null
      : row.distanceKmFromPlace < 1
        ? `${Math.round(row.distanceKmFromPlace * 1000)} m away`
        : `${row.distanceKmFromPlace} km away`;
  const blurbParts = [
    activity.locationName?.trim() || null,
    datePart,
    activity.time?.trim() || null,
    distance,
  ].filter(Boolean);
  return {
    id: activity.id,
    title: activity.title?.trim() || 'Rideshare',
    activityType: activity.activityType ?? 'rideshare',
    description: blurbParts.join(' · ') || activity.description || null,
    date: activity.date ?? null,
    time: activity.time ?? null,
    endDate: activity.endDate ?? null,
    endTime: activity.endTime ?? null,
  };
};

type PlaceReachableRidesSectionProps = {
  placeId: string;
};

export const PlaceReachableRidesSection = ({ placeId }: PlaceReachableRidesSectionProps) => {
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
    void fetchPlaceReachableRides(placeId, 1, PAGE_SIZE)
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
        void fetchPlaceReachableRides(placeId, nextPage, PAGE_SIZE)
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

  const hasRides = rows.length > 0;
  const sectionProps = {
    id: 'place-detail-rides' as const,
    title: 'Rides to this place' as const,
    tone: 'indigo' as const,
    ariaLabel: 'Rides to this place',
    collapsible: true,
    defaultExpanded: true,
  };

  if (loading) {
    return (
      <ConsumerDetailSection {...sectionProps}>
        <AsyncLoadingState variant="section" label={LOADING_NEARBY_RIDES} rows={2} />
      </ConsumerDetailSection>
    );
  }

  if (!hasRides) {
    return (
      <ConsumerDetailSection {...sectionProps}>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3.5 text-sm text-indigo-950 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/25 dark:text-indigo-100">
          <p className="font-semibold">No rides listed yet</p>
          <p className="mt-0.5 text-indigo-900/80 dark:text-indigo-200/80">
            Shared rides that head here (or to outings at this place) will appear as cards in this
            section.
          </p>
        </div>
      </ConsumerDetailSection>
    );
  }

  return (
    <ConsumerDetailSection {...sectionProps}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {rows.map((row) => (
          <li key={row.activity.id}>
            <ActivityLinkedRideshareAffordance rideshare={toSummary(row)} className="mt-0" />
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
