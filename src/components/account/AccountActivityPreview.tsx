import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { EventDTO, ChatConversationDTO } from '@uaetrail/shared-types';
import { EventRequestView } from '../../api/services';
import { AccountSectionHeader } from './AccountSectionHeader';

const requestStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

const formatTripDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

interface AccountActivityPreviewProps {
  messagesPath: string;
  upcomingTrip?: EventDTO;
  pendingRequests: EventRequestView[];
  conversations: ChatConversationDTO[];
}

/** Shows only actionable items — no empty states or duplicate full lists. */
export const AccountActivityPreview = ({
  messagesPath,
  upcomingTrip,
  pendingRequests,
  conversations,
}: AccountActivityPreviewProps) => {
  const unreadConversations = conversations.filter((c) => (c.unreadCount ?? 0) > 0).slice(0, 1);
  const pending = pendingRequests.slice(0, 2);

  const hasContent = Boolean(upcomingTrip) || pending.length > 0 || unreadConversations.length > 0;
  if (!hasContent) return null;

  return (
    <section>
      <AccountSectionHeader title="Up next" />
      <div className="space-y-2">
        {upcomingTrip && (
          <Link
            to={`/trip/${upcomingTrip.id}`}
            className="glass-card-interactive flex items-center gap-3 p-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/12 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {upcomingTrip.title || upcomingTrip.locationName}
              </p>
              <p className="text-xs text-neutral-500">{formatTripDate(upcomingTrip.date)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
          </Link>
        )}

        {pending.map((req) => (
          <Link
            key={req.id}
            to={`/my-requests/${req.id}`}
            className="glass-card-interactive flex items-center gap-3 p-3.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {req.event.title || req.event.locationName}
              </p>
              <p className="text-xs text-neutral-500">Awaiting response</p>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                requestStatusStyle[req.status] ?? requestStatusStyle.cancelled
              }`}
            >
              {req.status}
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
          </Link>
        ))}

        {unreadConversations.map((conv) => (
          <Link
            key={conv.userId}
            to={`${messagesPath}?to=${conv.userId}`}
            className="glass-card-interactive flex items-center gap-3 p-3.5"
          >
            {conv.avatarUrl ? (
              <img src={conv.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                {conv.displayName?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">{conv.displayName}</p>
              <p className="text-xs text-neutral-500 truncate">{conv.lastMessage ?? 'New message'}</p>
            </div>
            {(conv.unreadCount ?? 0) > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                {conv.unreadCount}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};
