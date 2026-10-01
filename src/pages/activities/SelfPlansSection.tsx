import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { MemberDemandManageSheet } from '../../components/host/MemberDemandManageSheet';
import { ActivityHubListRow } from '../../components/mobile/ActivityHubListRow';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';
import { explorePath } from '../../explore/routing';
import { matchesActivitySearch } from '../../utils/activitySearch';
import {
  formatParticipantIntentMeta,
  partitionParticipantIntentsForTrips,
} from '../../trips/participantIntentTrips';

const intentStatusClass: Record<ParticipantIntentDTO['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-700',
  fulfilled: 'bg-sky-500/15 text-sky-800',
  cancelled: 'bg-neutral-500/10 text-neutral-600',
};

/** Member-initiated plans (demand) — Trips tab “My plans” / completed “Self”. */
export const SelfPlansSection = ({
  segment,
  refreshKey = 0,
  searchQuery = '',
  peekBridgeOnly = false,
}: {
  segment: 'upcoming' | 'completed';
  refreshKey?: number;
  searchQuery?: string;
  /** Load intents + open manage sheet from `?peek=` without rendering the list (Upcoming tab). */
  peekBridgeOnly?: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manageIntent, setManageIntent] = useState<ParticipantIntentDTO | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-participant-intents'],
    queryFn: async () => {
      const res = await api.listMyParticipantIntents();
      return res.data;
    },
  });

  useEffect(() => {
    if (!refreshKey) return;
    void refetch();
  }, [refreshKey, refetch]);

  const { upcoming, completed } = useMemo(
    () => partitionParticipantIntentsForTrips(data ?? []),
    [data]
  );

  const visibleIntents = segment === 'upcoming' ? upcoming : completed;

  const filteredIntents = useMemo(
    () =>
      visibleIntents.filter((intent) =>
        matchesActivitySearch(searchQuery, intent.title, intent.preferredArea, intent.comment)
      ),
    [searchQuery, visibleIntents]
  );

  const openManage = (intent: ParticipantIntentDTO) => setManageIntent(intent);

  const openedDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    const openId = searchParams.get('peek');
    if (!openId || isLoading) return;
    if (openedDeepLinkRef.current === openId) return;
    const intent = (data ?? []).find((entry) => entry.id === openId);
    if (!intent) return;
    openedDeepLinkRef.current = openId;
    openManage(intent);
    const next = new URLSearchParams(searchParams);
    next.delete('peek');
    setSearchParams(next, { replace: true });
  }, [data, isLoading, searchParams, setSearchParams]);

  useEffect(() => {
    if (!manageIntent) return;
    const fresh = (data ?? []).find((entry) => entry.id === manageIntent.id);
    if (fresh) setManageIntent(fresh);
  }, [data, manageIntent?.id]);

  const peekId = searchParams.get('peek');
  const showList = !peekBridgeOnly;

  if (showList && isLoading) {
    return <ConsumerLoadingSpinner />;
  }

  if (showList && error) {
    return (
      <ConsumerErrorCard
        message={error instanceof Error ? error.message : 'Could not load your plans.'}
      />
    );
  }

  if (peekBridgeOnly && !peekId && !manageIntent) {
    return null;
  }

  if (peekBridgeOnly) {
    return (
      <MemberDemandManageSheet
        open={Boolean(manageIntent)}
        intent={manageIntent}
        onClose={() => setManageIntent(null)}
        onChanged={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {visibleIntents.length === 0 ? (
        <ConsumerInlineEmpty
          message={
            segment === 'upcoming'
              ? 'Nothing you’ve posted yet — find a crew or say what you’re looking for on the map.'
              : 'Closed or converted plans will show here.'
          }
          actionLabel="Open the map"
          actionTo={explorePath({ compose: 'menu' })}
        />
      ) : filteredIntents.length === 0 ? (
        <ConsumerInlineEmpty message="No plans match your search." />
      ) : (
        <div className="space-y-2">
          {filteredIntents.map((intent) => (
            <ActivityHubListRow
              key={intent.id}
              title={intent.title}
              meta={formatParticipantIntentMeta(intent)}
              badge={
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    intentStatusClass[intent.status]
                  }`}
                >
                  {intent.status === 'active' ? 'Live' : intent.status}
                </span>
              }
              onClick={() => openManage(intent)}
            />
          ))}
        </div>
      )}

      <MemberDemandManageSheet
        open={Boolean(manageIntent)}
        intent={manageIntent}
        onClose={() => setManageIntent(null)}
        onChanged={() => refetch()}
      />
    </div>
  );
};
