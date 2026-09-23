import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ChatConversationDTO } from '@uaetrail/shared-types';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY,
  PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE,
} from '../../content/productNorthStar';
import { ActivityHubEmptyState } from '../mobile/ActivityHubEmptyState';
import { ActivityHubListRow } from '../mobile/ActivityHubListRow';
import { ConsumerLoadingSkeleton } from '../mobile/ConsumerFeedback';
import { AccountSectionHeader } from '../account/AccountSectionHeader';
import { myActivitiesPath } from '../../utils/exploreRouting';
import type { UpcomingPlanRow } from '../../utils/activityHubSections';
import { requestStatusClassName, requestStatusLabel } from '../../utils/joinRequestUi';

const formatActivityDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const MAX_PLAN_ROWS = 3;

interface ProfileUpNextSectionProps {
  messagesPath: string;
  upcomingPlans: UpcomingPlanRow[];
  conversations: ChatConversationDTO[];
  loading?: boolean;
}

export const ProfileUpNextSection = ({
  messagesPath,
  upcomingPlans,
  conversations,
  loading = false,
}: ProfileUpNextSectionProps) => {
  const navigate = useNavigate();
  const unreadConversations = conversations.filter((c) => (c.unreadCount ?? 0) > 0).slice(0, 1);
  const planRows = upcomingPlans.slice(0, MAX_PLAN_ROWS);
  const hasContent = planRows.length > 0 || unreadConversations.length > 0;

  if (loading) {
    return (
      <section aria-label="Up next">
        <AccountSectionHeader title="Up next" />
        <ConsumerLoadingSkeleton />
      </section>
    );
  }

  if (!hasContent) {
    return (
      <section aria-label="Up next">
        <AccountSectionHeader title="Up next" />
        <ActivityHubEmptyState
          emoji="🌄"
          title={PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE}
          description={PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY}
          actionLabel={PRODUCT_EXPLORE_CTA}
          actionTo={EXPLORE_MAP_PATH}
        />
      </section>
    );
  }

  return (
    <section aria-label="Up next">
      <AccountSectionHeader
        title="Up next"
        actionTo={upcomingPlans.length > 0 ? myActivitiesPath('joined') : undefined}
        actionLabel={upcomingPlans.length > 0 ? 'All plans' : undefined}
      />
      <div className="space-y-2">
        {planRows.map((row) =>
          row.kind === 'confirmed' ? (
            <ActivityHubListRow
              key={`confirmed-${row.activity.id}`}
              title={row.activity.title || row.activity.locationName}
              meta={`${formatActivityDate(row.activity.date)} · You're going`}
              badge={
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                  Joined
                </span>
              }
              onClick={() => navigate(`/activity/${row.activity.id}`)}
            />
          ) : (
            <ActivityHubListRow
              key={`request-${row.request.id}`}
              title={row.request.activity.title || row.request.activity.locationName}
              meta={`${formatActivityDate(row.date)} · ${requestStatusLabel(row.request.status)}`}
              badge={
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${requestStatusClassName(row.request.status)}`}
                >
                  {requestStatusLabel(row.request.status)}
                </span>
              }
              onClick={() => navigate(`/my-requests/${row.request.id}`)}
            />
          )
        )}

        {unreadConversations.map((conv) => (
          <Link
            key={conv.userId}
            to={`${messagesPath}?to=${conv.userId}`}
            className="glass-card-interactive flex items-center gap-3 p-3.5"
          >
            {conv.avatarUrl ? (
              <img src={conv.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {conv.displayName?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{conv.displayName}</p>
              <p className="truncate text-xs text-neutral-500">{conv.lastMessage ?? 'New message'}</p>
            </div>
            {(conv.unreadCount ?? 0) > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                {conv.unreadCount}
              </span>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
          </Link>
        ))}
      </div>
    </section>
  );
};
