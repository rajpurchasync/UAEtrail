import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { fetchActivityLinkedRides } from '../../hooks/publicActivityClientApi';
import { ActivityLinkedRideshareAffordance } from '../../components/activity/ActivityLinkedRideshareAffordance';
import { AsyncLoadingState } from '../../components/ui/AsyncLoadingState';
import {
  ACTIVITY_DETAIL_LINKED_RIDESHARE_LABEL,
  ACTIVITY_DETAIL_LINKED_RIDES_JUMP_LABEL,
  ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID,
} from '../../content/activityDetailCopy';
import { LOADING_NEARBY_RIDES } from '../../content/detailLoadingCopy';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import type { ActivityLinkagePlanSummary } from '../resolveActivityLinkageSummaries';

const toSummary = (ride: ActivityDTO): ActivityLinkagePlanSummary => ({
  id: ride.id,
  title: ride.title?.trim() || ride.locationName?.trim() || 'Rideshare',
  activityType: ride.activityType ?? 'rideshare',
  description: ride.description ?? null,
  date: ride.date ?? null,
  time: ride.time ?? null,
  endDate: ride.endDate ?? null,
  endTime: ride.endTime ?? null,
});

type Props = {
  activityId: string;
  /** Host / offer UI rendered below the ride cards when provided. */
  offerSlot?: ReactNode;
  className?: string;
};

/**
 * Published rideshare offers linked to this outing (`linkedActivityId`).
 * Defers the linked-rides fetch until the section nears the viewport.
 */
export const ActivityLinkedRidesSection = ({ activityId, offerSlot, className }: Props) => {
  const [rides, setRides] = useState<ActivityDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || activated) return;
    if (typeof IntersectionObserver === 'undefined') {
      setActivated(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activated, activityId]);

  useEffect(() => {
    if (!activated) return;
    let cancelled = false;
    setLoading(true);
    void fetchActivityLinkedRides(activityId)
      .then((linked) => {
        if (!cancelled) setRides(linked);
      })
      .catch(() => {
        if (!cancelled) setRides([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activated, activityId]);

  const pageKey = `activity:${activityId}`;
  const hasOffer = Boolean(offerSlot);

  const body = (() => {
    if (!activated || loading) {
      return <AsyncLoadingState variant="section" label={LOADING_NEARBY_RIDES} rows={1} />;
    }
    if (rides.length === 0 && !hasOffer) {
      return (
        <>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">No rides linked yet</p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-300">
            When someone offers a shared ride to this outing, it will show up here.
          </p>
        </>
      );
    }
    return (
      <div className="space-y-3">
        {rides.map((ride) => (
          <ActivityLinkedRideshareAffordance
            key={ride.id}
            rideshare={toSummary(ride)}
            className="mt-0"
          />
        ))}
        {offerSlot}
      </div>
    );
  })();

  return (
    <div ref={sectionRef}>
      <ConsumerDetailSection
        id={ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID}
        title={ACTIVITY_DETAIL_LINKED_RIDES_JUMP_LABEL}
        tone="sky"
        ariaLabel={ACTIVITY_DETAIL_LINKED_RIDESHARE_LABEL}
        collapsible
        defaultExpanded
        pageKey={pageKey}
        className={className}
      >
        {body}
      </ConsumerDetailSection>
    </div>
  );
};
