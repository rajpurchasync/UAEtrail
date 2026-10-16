import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { useMyParticipantIntents } from '../../hooks/useMyParticipantIntents';
import { useConsoleHubData } from '../../console/useHubData';
import { useOperatorActivityManageActions } from '../../hooks/useOperatorActivityManageActions';
import { ActivityManageSheet } from '../activity/ActivityManageSheet';
import { ParticipantIntentManageSheet } from '../participant-intent/ParticipantIntentManageSheet';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../mobile/ConsumerFeedback';
import { explorePath } from '../../explore/routing';
import { PRO_MEMBERSHIP_PATH } from '../../config/routingCatalog';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import { resolveJoinRequestActivity } from '../../utils/joinRequestActivity';
import type { ActivityRequestView } from '../../api/types';
import { formatDate } from '../../utils';
import { formatActivityType, resolveActivityTitle } from '../../utils/activityIdentity';
import {
  formatParticipantIntentMeta,
  partitionParticipantIntentsForPlanHub,
} from '../../member-plan/participantIntentPlan';
import { PlanCommitmentCard } from './PlanCommitmentCard';

const pendingCountForActivity = (activityId: string, requests: ActivityRequestView[]) =>
  requests.filter((request) => {
    if (request.status !== 'pending') return false;
    return resolveJoinRequestActivity(request)?.id === activityId;
  }).length;

type HostingRow =
  | { kind: 'activity'; sortDate: string; activity: ActivityDTO; pending: number }
  | { kind: 'seeking'; sortDate: string; intent: ParticipantIntentDTO };

type PlanHostingUpcomingProps = {
  refreshKey?: number;
  canHost: boolean;
};

/**
 * My Plans → Upcoming → hosting filter: published activities you organize + open seeking intents.
 * `Plan` = `/plan` surface namespace only — not a domain entity.
 */
export const PlanHostingUpcoming = ({ refreshKey = 0, canHost }: PlanHostingUpcomingProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const host = useConsoleHubData();
  const hostActions = useOperatorActivityManageActions(host.tenantId, host.reload);
  const inviteShare = useActivityInviteShareSheet();
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageIntent, setManageIntent] = useState<ParticipantIntentDTO | null>(null);

  const {
    intents,
    loading: intentsLoading,
    refetch: refetchIntents,
  } = useMyParticipantIntents(true, refreshKey);

  useEffect(() => {
    if (!refreshKey) return;
    void host.reload();
    void refetchIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps; host.reload is stable
  }, [refreshKey, host.reload, refetchIntents]);

  const today = useMemo(() => new Date(new Date().toDateString()), []);

  const hostedActivityIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of host.activities) ids.add(a.id);
    return ids;
  }, [host.activities]);

  const rows = useMemo((): HostingRow[] => {
    const list: HostingRow[] = [];
    for (const event of host.activities) {
      if (event.status === 'draft') continue;
      if (new Date(event.date) < today) continue;
      list.push({
        kind: 'activity',
        sortDate: event.date,
        activity: event,
        pending: pendingCountForActivity(event.id, host.pendingRequests),
      });
    }
    const { upcoming } = partitionParticipantIntentsForPlanHub(intents);
    for (const intent of upcoming) {
      const activityId = intent.activityId ?? intent.seekingActivityId;
      if (activityId && hostedActivityIds.has(activityId)) continue;
      const sortDate = intent.date ?? today.toISOString().slice(0, 10);
      list.push({ kind: 'seeking', sortDate, intent });
    }
    return list.sort(
      (a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime()
    );
  }, [host.activities, host.pendingRequests, intents, hostedActivityIds, today]);

  const openManage = (activity: ActivityDTO) => setManageActivity(activity);

  const openedDeepLinkRef = useRef<string | null>(null);
  useEffect(() => {
    const openId = searchParams.get('peek') ?? searchParams.get('roster') ?? searchParams.get('checkin');
    if (!openId || host.loading) return;
    if (openedDeepLinkRef.current === openId) return;
    const activity = host.activities.find((event) => event.id === openId);
    if (activity) {
      openedDeepLinkRef.current = openId;
      openManage(activity);
    } else {
      const intent = intents.find((entry) => entry.id === openId);
      if (intent) {
        openedDeepLinkRef.current = openId;
        setManageIntent(intent);
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete('peek');
    next.delete('checkin');
    next.delete('roster');
    setSearchParams(next, { replace: true });
  }, [host.activities, host.loading, intents, searchParams, setSearchParams]);

  if (!canHost) {
    return (
      <ConsumerInlineEmpty
        message="Organize outings on the map to share them with others."
        actionLabel="Pro membership"
        actionTo={PRO_MEMBERSHIP_PATH}
      />
    );
  }

  if (host.loading || intentsLoading) {
    return <ConsumerLoadingSpinner className="py-12" />;
  }

  if (hostActions.error || host.error) {
    return <ConsumerErrorCard message={hostActions.error ?? host.error ?? ''} />;
  }

  if (!host.tenantId) {
    return (
      <ConsumerInlineEmpty
        message="Organizer profile is still loading — try again in a moment."
        actionLabel="Refresh"
        actionTo="/plan"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <ConsumerInlineEmpty
        message="Nothing you’re hosting yet — organize on the map or post what you’re looking for."
        actionLabel="Open Explore"
        actionTo={explorePath({ compose: 'menu' })}
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        if (row.kind === 'activity') {
          const activity = row.activity;
          const isSeeking = activity.activityMode === 'seeking';
          const pendingHint =
            row.pending > 0
              ? `${row.pending} join request${row.pending === 1 ? '' : 's'}`
              : null;
          return (
            <PlanCommitmentCard
              key={activity.id}
              title={resolveActivityTitle(activity)}
              dateLabel={formatDate(activity.date)}
              timeLabel={activity.time}
              locationLabel={activity.locationName?.trim() || 'Location TBD'}
              activityTypeLabel={formatActivityType(activity.activityType)}
              badge={isSeeking ? 'Looking for company' : 'Organizing'}
              participants={activity.participantPreviews}
              actionHint={pendingHint}
              onClick={() => openManage(activity)}
            />
          );
        }
        const intent = row.intent;
        const meta = formatParticipantIntentMeta(intent);
        return (
          <PlanCommitmentCard
            key={intent.id}
            title={intent.title}
            dateLabel={intent.date ? formatDate(intent.date) : 'Flexible'}
            timeLabel={intent.time}
            locationLabel={intent.preferredArea?.trim() || meta}
            badge="Looking for company"
            onClick={() => setManageIntent(intent)}
          />
        );
      })}

      {inviteShare.sheet}

      <ActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={host.tenantId}
        pendingRequests={host.pendingRequests}
        actions={hostActions}
        initialView="overview"
        onOpenPublicPage={(a) => navigate(`/activity/${a.id}`)}
        onShare={(a) => inviteShare.openInviteFromActivity(a)}
        onClose={() => setManageActivity(null)}
        onRequestsChanged={host.reload}
      />

      <ParticipantIntentManageSheet
        open={Boolean(manageIntent)}
        intent={manageIntent}
        onClose={() => setManageIntent(null)}
        onChanged={() => void refetchIntents()}
      />
    </div>
  );
};
