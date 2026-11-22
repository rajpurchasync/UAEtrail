import { Search, Users, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { LIST_SEARCH } from '../../list/browse/listChromeTheme';
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

/** Start a DM (search-first) or jump to group create — familiar messenger compose pattern. */
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
}: MessagesComposeSheetProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = searchQuery.trim();
  const canSearch = trimmed.length >= 2;
  const hasQuery = trimmed.length > 0;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  const searchToolbar = (
    <label className={`w-full ${LIST_SEARCH.shell}`}>
      <Search className={LIST_SEARCH.icon} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or email"
        className={LIST_SEARCH.input}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-label="Search for someone to message"
      />
      {hasQuery ? (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="shrink-0 rounded-full p-0.5 text-neutral-500 hover:text-neutral-800"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </label>
  );

  const footer = (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={onCreateGroup}
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 text-left active:scale-[0.99]"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
          aria-hidden
        >
          <Users className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-neutral-900">Create a group</span>
          <span className="mt-0.5 block text-xs text-neutral-500">Friends or family — you pick who’s in</span>
        </span>
      </button>
      <p className="text-center text-[11px] leading-relaxed text-neutral-400">
        Outing crew chats show up in your inbox when you join a plan.
      </p>
    </div>
  );

  return (
    <ConsumerBottomSheet
      open={open}
      onClose={onClose}
      title="New message"
      subtitle="Pick someone to message"
      toolbar={searchToolbar}
      footer={footer}
      zIndex={1400}
    >
      <div className="min-h-[8rem]">
        {searching ? (
          <ChatLoadingState variant="list" label="Searching" rows={3} />
        ) : !canSearch ? (
          <p className="py-6 text-center text-xs leading-relaxed text-neutral-500">
            Search people you follow or have hiked with. Type at least 2 characters.
          </p>
        ) : searchResults.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">No people found</p>
        ) : (
          <ul className="-mx-1 divide-y divide-neutral-100">
            {searchResults.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(u)}
                  className="consumer-list-row-interactive flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left active:bg-neutral-50"
                >
                  <MessageAvatar name={userLabel(u)} url={u.avatarUrl ?? undefined} size="sm" />
                  <p className="min-w-0 truncate text-sm font-medium text-neutral-900">{userLabel(u)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ConsumerBottomSheet>
  );
};
