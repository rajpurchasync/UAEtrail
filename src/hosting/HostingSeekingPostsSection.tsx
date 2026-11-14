import { useEffect, useMemo } from 'react';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { useMySeekingPosts } from '../hooks/useMySeekingPosts';
import { useConsoleHubData } from '../console/useHubData';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../components/mobile/ConsumerFeedback';
import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';
import { formatDate } from '../utils';
import {
  formatParticipantIntentMeta,
  partitionParticipantIntentsForPlanHub,
} from '../member-plan/participantIntentPlan';
import { usePlanHostingManage } from '../plan/PlanHostingManageContext';
import { PlanCommitmentCard } from '../components/plan/PlanCommitmentCard';

type HostingSeekingPostsSectionProps = {
  refreshKey?: number;
  canHost: boolean;
};

/**
 * `/hosting` — open “find company” seeking posts (hosted activities use schedule rows above).
 */
export const HostingSeekingPostsSection = ({
  refreshKey = 0,
  canHost,
}: HostingSeekingPostsSectionProps) => {
  const host = useConsoleHubData(true, { fetchActivities: false });
  const { openManageIntent } = usePlanHostingManage();

  const {
    intents,
    loading: intentsLoading,
    refetch: refetchIntents,
  } = useMySeekingPosts(true, refreshKey);

  useEffect(() => {
    if (!refreshKey) return;
    void host.reload();
    void refetchIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps
  }, [refreshKey, host.reload, refetchIntents]);

  const hostedActivityIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of host.activities) ids.add(a.id);
    return ids;
  }, [host.activities]);

  const seekingRows = useMemo((): ParticipantIntentDTO[] => {
    const today = new Date(new Date().toDateString());
    const { upcoming } = partitionParticipantIntentsForPlanHub(intents);
    return upcoming.filter((intent) => {
      const activityId = intent.activityId ?? intent.seekingActivityId;
      if (activityId && hostedActivityIds.has(activityId)) return false;
      return true;
    }).sort((a, b) => {
      const aDate = a.date ?? today.toISOString().slice(0, 10);
      const bDate = b.date ?? today.toISOString().slice(0, 10);
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }, [hostedActivityIds, intents]);

  if (!canHost) {
    return (
      <ConsumerInlineEmpty
        message="Host outings on the map to share them with others."
        actionLabel="Pro membership"
        actionTo={PRO_MEMBERSHIP_PATH}
      />
    );
  }

  if (host.loading || intentsLoading) {
    return <ConsumerLoadingSpinner className="py-12" />;
  }

  if (host.error) {
    return <ConsumerErrorCard message={host.error ?? ''} />;
  }

  if (seekingRows.length === 0) {
    return <ConsumerInlineEmpty message="No open “find company” posts." />;
  }

  return (
    <div className="space-y-2 md:space-y-1.5">
      {seekingRows.map((intent) => {
        const meta = formatParticipantIntentMeta(intent);
        return (
          <PlanCommitmentCard
            key={intent.id}
            title={intent.title}
            dateLabel={intent.date ? formatDate(intent.date) : 'Flexible'}
            timeLabel={intent.time}
            locationLabel={intent.preferredArea?.trim() || meta}
            badge="Looking for company"
            onClick={() => openManageIntent(intent)}
          />
        );
      })}
    </div>
  );
};