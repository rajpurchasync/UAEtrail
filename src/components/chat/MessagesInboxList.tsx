import { Calendar, MessageSquare, Users } from 'lucide-react';
import {
  inboxThreadBadgeLabel,
  partitionInboxThreadsForHub,
  type InboxFilter,
  type InboxThread,
} from '../../utils/inboxThreads';
import { CHAT_CHROME } from './chatChrome';
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

const ThreadLeadingVisual = ({ thread }: { thread: InboxThread }) => {
  if (thread.kind === 'direct') {
    return <MessageAvatar name={thread.title} url={thread.avatarUrl} size="md" />;
  }
  if (thread.avatarUrl) {
    return <img src={thread.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />;
  }
  const shell =
    thread.kind === 'activity-chat'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-sky-50 text-sky-700';
  const Icon = thread.kind === 'activity-chat' ? Calendar : Users;
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${shell}`}>
      <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
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
  showTypeBadge = false,
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
      className={`chat-row consumer-list-row-interactive flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 md:px-3 md:py-2.5 ${
        isSelected ? 'chat-row-selected consumer-list-row-selected' : ''
      }`}
    >
      <ThreadLeadingVisual thread={thread} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`min-w-0 truncate text-[15px] font-semibold ${unread ? 'text-neutral-950' : 'text-neutral-900'}`}>
            {thread.title}
          </p>
          <span className={`shrink-0 text-xs ${unread ? 'font-semibold text-emerald-600' : 'text-neutral-400'}`}>
            {formatTime(thread.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`min-w-0 truncate text-[13px] font-emoji ${unread ? 'font-medium text-neutral-700' : 'text-neutral-500'}`}
          >
            {badge && showTypeBadge ? (
              <span className="sr-only">{badge}. </span>
            ) : null}
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

const HubEmpty = ({
  filteredEmpty,
}: {
  filteredEmpty: boolean;
}) => (
  <div className="px-4 py-16 text-center">
    <MessageSquare className="mx-auto mb-3 h-10 w-10 text-neutral-300" strokeWidth={1.75} aria-hidden />
    <p className="text-sm font-medium text-neutral-700">{filteredEmpty ? 'No matches' : 'Your inbox is quiet'}</p>
    <p className="mt-2 text-xs leading-relaxed text-neutral-500">
      {filteredEmpty
        ? 'Try another filter or clear search.'
        : 'Crew chats show up when you join an outing. Direct messages land here too.'}
    </p>
  </div>
);

const renderThreadRows = (
  threads: InboxThread[],
  props: Omit<Parameters<typeof ThreadRow>[0], 'thread' | 'showTypeBadge'>,
  showTypeBadge: boolean
) =>
  threads.map((thread) => (
    <ThreadRow key={`${thread.kind}-${thread.id}`} thread={thread} showTypeBadge={showTypeBadge} {...props} />
  ));

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
      <div role="alert" className="px-4 py-16 text-center">
        <p className="text-sm font-medium text-neutral-800">Couldn’t load chats</p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">Check your connection and open Chat again.</p>
      </div>
    );
  }

  if (threads.length === 0) {
    const filteredEmpty = inboxFilter !== 'all' || inboxQuery.trim().length > 0;
    return <HubEmpty filteredEmpty={filteredEmpty} />;
  }

  const rowProps = {
    selectedDirectId,
    selectedGroupId,
    onSelectDirect,
    onSelectGroup,
    formatTime,
  };

  const sectioned = inboxFilter === 'all' && !inboxQuery.trim();
  const { outings, rest } = sectioned ? partitionInboxThreadsForHub(threads) : { outings: [], rest: threads };

  return (
    <div className={`chat-inbox ${CHAT_CHROME.hubListSurface}`}>
      {sectioned && outings.length > 0 ? (
        <>
          <p className={CHAT_CHROME.sectionLabel}>Community</p>
          {renderThreadRows(outings, rowProps, false)}
          {rest.length > 0 ? (
            <>
              <p className={CHAT_CHROME.sectionLabel}>Messages</p>
              {renderThreadRows(rest, rowProps, false)}
            </>
          ) : null}
        </>
      ) : (
        renderThreadRows(threads, rowProps, inboxFilter === 'all')
      )}
    </div>
  );
};
