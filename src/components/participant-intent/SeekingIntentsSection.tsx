import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { useMyParticipantIntents } from '../../hooks/useMyParticipantIntents';
import { ParticipantIntentManageSheet } from '../participant-intent/ParticipantIntentManageSheet';
import { ActivityHubListRow } from '../mobile/ActivityHubListRow';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../mobile/ConsumerFeedback';
import { explorePath } from '../../explore/routing';
import { matchesActivitySearch } from '../../utils/activitySearch';
import {
  formatParticipantIntentMeta,
  partitionParticipantIntentsForPlanHub,
} from '../../member-plan/participantIntentPlan';

const intentStatusClass: Record<ParticipantIntentDTO['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-700',
  fulfilled: 'bg-sky-500/15 text-sky-800',
  cancelled: 'bg-neutral-500/10 text-neutral-600',
};

/** Lists the member’s seeking posts (`/me/seeking-posts`) — `/plan` peek bridge and history self-logged. */
export const SeekingIntentsSection = ({
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

  const {
    intents,
    loading: isLoading,
    error: loadError,
    refetch,
  } = useMyParticipantIntents(true, refreshKey);
  const error = loadError ? new Error(loadError) : null;

  const { upcoming, completed } = useMemo(
    () => partitionParticipantIntentsForPlanHub(intents),
    [intents]
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
    const intent = intents.find((entry) => entry.id === openId);
    if (!intent) return;
    openedDeepLinkRef.current = openId;
    openManage(intent);
    const next = new URLSearchParams(searchParams);
    next.delete('peek');
    setSearchParams(next, { replace: true });
  }, [intents, isLoading, searchParams, setSearchParams]);

  useEffect(() => {
    if (!manageIntent) return;
    const fresh = intents.find((entry) => entry.id === manageIntent.id);
    if (fresh) setManageIntent(fresh);
  }, [intents, manageIntent]);

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
      <ParticipantIntentManageSheet
        open={Boolean(manageIntent)}
        intent={manageIntent}
        onClose={() => setManageIntent(null)}
        onChanged={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {visibleIntents.length === 0 ? (
        <ConsumerInlineEmpty
          message={
            segment === 'upcoming'
              ? 'Nothing youΓÇÖve posted yet ΓÇö find a crew or say what youΓÇÖre looking for on the map.'
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
                  {intent.status === 'active' ? 'Seeking' : intent.status}
                </span>
              }
              onClick={() => openManage(intent)}
            />
          ))}
        </div>
      )}

      <ParticipantIntentManageSheet
        open={Boolean(manageIntent)}
        intent={manageIntent}
        onClose={() => setManageIntent(null)}
        onChanged={() => {
          void refetch();
        }}
      />
    </div>
  );
};
