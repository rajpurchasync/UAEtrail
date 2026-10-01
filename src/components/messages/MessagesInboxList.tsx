import { Loader2, MessageSquare, Users } from 'lucide-react';
import { inboxThreadBadgeLabel, type InboxFilter, type InboxThread } from '../../utils/inboxThreads';
import { MessageAvatar } from './MessagePanels';

interface MessagesInboxListProps {
  threads: InboxThread[];
  loading: boolean;
  inboxFilter: InboxFilter;
  inboxQuery: string;
  selectedDirectId?: string | null;
  onSelectDirect: (userId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onCompose: () => void;
  formatTime: (dateStr: string) => string;
}

const GroupAvatar = ({ url }: { url?: string }) => {
  if (url) {
    return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
      <Users className="h-4 w-4" aria-hidden />
    </div>
  );
};

const SECTION_ORDER: Array<{ kind: InboxThread['kind']; title: string }> = [
  { kind: 'direct', title: 'Direct messages' },
  { kind: 'user-group', title: 'Your groups' },
  { kind: 'activity-chat', title: 'Outing chats' },
];

const ThreadRow = ({
  thread,
  selectedDirectId,
  onSelectDirect,
  onSelectGroup,
  formatTime,
  showTypeBadge = true,
}: {
  thread: InboxThread;
  selectedDirectId?: string | null;
  onSelectDirect: (userId: string) => void;
  onSelectGroup: (groupId: string) => void;
  formatTime: (dateStr: string) => string;
  showTypeBadge?: boolean;
}) => {
  const badge = showTypeBadge ? inboxThreadBadgeLabel(thread) : null;
  const isDirect = thread.kind === 'direct';
  const isSelected = isDirect && selectedDirectId === thread.id;

  return (
    <button
      type="button"
      onClick={() => (isDirect ? onSelectDirect(thread.id) : onSelectGroup(thread.id))}
      className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-50 ${
        isSelected ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
      }`}
    >
      {isDirect ? (
        <MessageAvatar name={thread.title} url={thread.avatarUrl} />
      ) : (
        <GroupAvatar url={thread.kind === 'user-group' ? thread.avatarUrl : undefined} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`truncate text-sm font-semibold ${
                thread.unreadCount > 0 ? 'text-neutral-900' : 'text-neutral-800'
              }`}
            >
              {thread.title}
            </p>
            {badge ? (
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                {badge}
              </span>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-neutral-400">{formatTime(thread.lastMessageAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs font-emoji ${
              thread.unreadCount > 0 ? 'font-medium text-neutral-700' : 'text-neutral-500'
            }`}
          >
            {thread.lastMessage}
          </p>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {thread.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

export const MessagesInboxList = ({
  threads,
  loading,
  inboxFilter,
  inboxQuery,
  selectedDirectId,
  onSelectDirect,
  onSelectGroup,
  onCompose,
  formatTime,
}: MessagesInboxListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center shadow-ios-sm">
        <MessageSquare className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
        <p className="text-sm text-neutral-600">No conversations here yet.</p>
        <p className="mt-2 text-xs text-neutral-500">
          Direct chats with hosts and friends, groups you create, and outing crew chats when you join a plan.
        </p>
        <button
          type="button"
          onClick={onCompose}
          className="mt-4 text-sm font-semibold text-emerald-700"
        >
          Start a conversation
        </button>
      </div>
    );
  }

  const showGrouped = inboxFilter === 'all' && !inboxQuery.trim();

  if (!showGrouped) {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-ios-sm">
        {threads.map((thread) => (
          <ThreadRow
            key={`${thread.kind}-${thread.id}`}
            thread={thread}
            selectedDirectId={selectedDirectId}
            onSelectDirect={onSelectDirect}
            onSelectGroup={onSelectGroup}
            formatTime={formatTime}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {SECTION_ORDER.map(({ kind, title }) => {
        const sectionThreads = threads.filter((thread) => thread.kind === kind);
        if (sectionThreads.length === 0) return null;

        return (
          <section key={kind}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-ios-sm">
              {sectionThreads.map((thread) => (
                <ThreadRow
                  key={`${thread.kind}-${thread.id}`}
                  thread={thread}
                  selectedDirectId={selectedDirectId}
                  onSelectDirect={onSelectDirect}
                  onSelectGroup={onSelectGroup}
                  formatTime={formatTime}
                  showTypeBadge={kind !== 'direct'}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
