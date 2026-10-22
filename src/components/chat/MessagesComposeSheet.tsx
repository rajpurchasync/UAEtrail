import { MessageCircle, Search, Users } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { MessageAvatar } from './ChatMessageAvatar';
import { ChatLoadingState } from './ChatLoadingState';

interface SearchUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

type MessagesComposeSheetProps = {
  open: boolean;
  searchQuery: string;
  searching: boolean;
  searchResults: SearchUser[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelectUser: (user: SearchUser) => void;
  onCreateGroup: () => void;
  userLabel: (u: Pick<SearchUser, 'displayName' | 'id'>) => string;
};

export const MessagesComposeSheet = ({
  open,
  searchQuery,
  searching,
  searchResults,
  onClose,
  onSearchChange,
  onSelectUser,
  onCreateGroup,
  userLabel,
}: MessagesComposeSheetProps) => (
  <Dialog open={open} onClose={onClose} title="New message" variant="form" className="!p-0 max-w-lg w-full">
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5">
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">
        Message a host or friend, or start a group for family and friends. Outing crew chats appear when you join an
        activity.
      </p>

      <button
        type="button"
        onClick={onCreateGroup}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-left transition-colors hover:bg-neutral-100"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-neutral-900">Create a group</span>
          <span className="block text-xs text-neutral-500">Family or friends — you manage members</span>
        </span>
      </button>

      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        Direct message
      </div>

      <div className="relative mb-3 shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full min-h-[44px] rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          autoComplete="off"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-touch -mx-1 px-1">
        {searching ? (
          <ChatLoadingState variant="list" label="Searching people" rows={3} />
        ) : searchResults.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            {searchQuery.trim().length >= 2 ? 'No people found' : 'Type at least 2 characters to search'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {searchResults.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(u)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <MessageAvatar name={userLabel(u)} url={u.avatarUrl ?? undefined} size="sm" />
                  <p className="min-w-0 truncate text-sm font-medium text-neutral-900">{userLabel(u)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </Dialog>
);
