import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import type { ChatConversationDTO } from '@uaetrail/shared-types';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY,
  PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE,
} from '../../content/productNorthStar';
import { AppButtonLink } from '../mobile/AppButton';
import { GlassCard } from '../mobile/GlassCard';
import { AccountSectionHeader } from '../account/AccountSectionHeader';
import { myActivitiesPath } from '../../utils/exploreRouting';
import type { UpcomingPlanRow } from '../../utils/activityHubSections';
import { requestStatusLabel } from '../../utils/joinRequestUi';

const requestStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  waitlisted: 'bg-sky-500/15 text-sky-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

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
  const unreadConversations = conversations.filter((c) => (c.unreadCount ?? 0) > 0).slice(0, 1);
  const planRows = upcomingPlans.slice(0, MAX_PLAN_ROWS);
  const hasContent = planRows.length > 0 || unreadConversations.length > 0;

  if (loading) {
    return (
      <section aria-label="Up next">
        <AccountSectionHeader title="Up next" />
        <GlassCard padding className="animate-pulse space-y-3">
          <div className="h-12 rounded-xl bg-neutral-100" />
          <div className="h-12 rounded-xl bg-neutral-100" />
        </GlassCard>
      </section>
    );
  }

  if (!hasContent) {
    return (
      <section aria-label="Up next">
        <AccountSectionHeader title="Up next" />
        <GlassCard padding className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden>
            🌄
          </div>
          <p className="mt-3 text-sm font-bold text-neutral-900">{PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE}</p>
          <p className="mt-1 text-[13px] leading-snug text-neutral-500">{PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY}</p>
          <AppButtonLink to={EXPLORE_MAP_PATH} fullWidth className="mt-4">
            {PRODUCT_EXPLORE_CTA}
          </AppButtonLink>
        </GlassCard>
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
            <Link
              key={`confirmed-${row.activity.id}`}
              to={`/activity/${row.activity.id}`}
              className="glass-card-interactive flex items-center gap-3 p-3.5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {row.activity.title || row.activity.locationName}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatActivityDate(row.activity.date)} · You&apos;re going
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
            </Link>
          ) : (
            <Link
              key={`request-${row.request.id}`}
              to={`/my-requests/${row.request.id}`}
              className="glass-card-interactive flex items-center gap-3 p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {row.request.activity.title || row.request.activity.locationName}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatActivityDate(row.date)} · {requestStatusLabel(row.request.status)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${
                  requestStatusStyle[row.request.status] ?? requestStatusStyle.cancelled
                }`}
              >
                {row.request.status}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
            </Link>
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
