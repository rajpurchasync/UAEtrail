import { MessageSquare, Users } from 'lucide-react';
import { inboxThreadBadgeLabel, type InboxFilter, type InboxThread } from '../../utils/inboxThreads';
import { MessageAvatar } from './ChatMessageAvatar';
import { ChatLoadingState } from './ChatLoadingState';

interface MessagesInboxListProps {
  threads: InboxThread[];
  loading: boolean;
  unavailable?: boolean;
  inboxFilter: InboxFilter;
  inboxQuery: string;
  selectedDirectId?: string | null;
  selectedGroupId?: string | null;
  onSelectDirect: (userId: string) => void;
  onSelectGroup: (groupId: string) => void;
  formatTime: (dateStr: string) => string;
}

const GroupAvatar = ({ url }: { url?: string }) => {
  if (url) {
    return <img src={url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
      <Users className="h-5 w-5" aria-hidden />
    </div>
  );
};

const ThreadRow = ({
  thread,
  selectedDirectId,
  selectedGroupId,
  onSelectDirect,
  onSelectGroup,
  formatTime,
  showTypeBadge = true,
}: {
  thread: InboxThread;
  selectedDirectId?: string | null;
  selectedGroupId?: string | null;
  onSelectDirect: (userId: string) => void;
  onSelectGroup: (groupId: string) => void;
  formatTime: (dateStr: string) => string;
  showTypeBadge?: boolean;
}) => {
  const badge = showTypeBadge ? inboxThreadBadgeLabel(thread) : null;
  const isDirect = thread.kind === 'direct';
  const isSelected = isDirect ? selectedDirectId === thread.id : selectedGroupId === thread.id;
  const unread = thread.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => (isDirect ? onSelectDirect(thread.id) : onSelectGroup(thread.id))}
      data-nav-focus={`chat-thread-${thread.id}`}
      className={`chat-row flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 ${
        isSelected ? 'chat-row-selected bg-emerald-50' : ''
      }`}
    >
      {isDirect ? (
        <MessageAvatar name={thread.title} url={thread.avatarUrl} size="lg" />
      ) : (
        <GroupAvatar url={thread.kind === 'user-group' ? thread.avatarUrl : undefined} />
      )}
      <div className="min-w-0 flex-1 border-b border-neutral-100 py-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className={`truncate text-[15px] font-semibold ${unread ? 'text-neutral-950' : 'text-neutral-900'}`}>
              {thread.title}
            </p>
            {badge ? (
              <span className="chat-kind-pill shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                {badge}
              </span>
            ) : null}
          </div>
          <span className={`shrink-0 text-xs ${unread ? 'font-semibold text-emerald-600' : 'text-neutral-400'}`}>
            {formatTime(thread.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`truncate text-[13px] font-emoji ${unread ? 'font-medium text-neutral-700' : 'text-neutral-500'}`}>
            {thread.lastMessage}
          </p>
          {unread ? (
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
  unavailable = false,
  inboxFilter,
  inboxQuery,
  selectedDirectId,
  selectedGroupId,
  onSelectDirect,
  onSelectGroup,
  formatTime,
}: MessagesInboxListProps) => {
  if (loading) {
    return <ChatLoadingState variant="list" label="Loading chats" />;
  }

  if (unavailable) {
    return (
      <div role="alert" className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center shadow-ios-sm">
        <p className="text-sm font-medium text-neutral-800">Couldn’t load chats</p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">Check your connection and open Chat again.</p>
      </div>
    );
  }

  if (threads.length === 0) {
    const filteredEmpty = inboxFilter !== 'all' || inboxQuery.trim().length > 0;
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center shadow-ios-sm">
        <MessageSquare className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">
          {filteredEmpty ? 'No matches' : 'Your inbox is quiet'}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          {filteredEmpty
            ? 'Try another filter or clear search.'
            : 'Crew chats show up when you join an outing. Host and buddy messages land here too.'}
        </p>
      </div>
    );
  }

  const showGrouped = inboxFilter === 'all' && !inboxQuery.trim();

  const rows = (showGrouped ? threads : threads).map((thread) => (
    <ThreadRow
      key={`${thread.kind}-${thread.id}`}
      thread={thread}
      selectedDirectId={selectedDirectId}
      selectedGroupId={selectedGroupId}
      onSelectDirect={onSelectDirect}
      onSelectGroup={onSelectGroup}
      formatTime={formatTime}
      showTypeBadge={!showGrouped || thread.kind !== 'direct'}
    />
  ));

  return <div className="chat-inbox overflow-hidden">{rows}</div>;
};
