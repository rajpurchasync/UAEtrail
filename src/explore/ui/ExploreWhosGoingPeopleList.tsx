import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { SecureAvatar } from '../../components/ui';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import type { WhosGoingFriendRow } from '../whosGoingFriends';
import { messagesRouteForRole } from '../../utils/authRouting';
import type { UserRole } from '@uaetrail/shared-types';
type ExploreWhosGoingPeopleListProps = {
  rows: WhosGoingFriendRow[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userRole: UserRole | undefined;
  onOpenTrip: (item: ExploreMapItemDTO) => void;
};

const tripHint = (row: WhosGoingFriendRow): string | null => {
  if (row.hosting) return `Hosting · ${row.hosting.title}`;
  if (row.joining) return `Joining · ${row.joining.title}`;
  return null;
};

export const ExploreWhosGoingPeopleList = ({
  rows,
  loading,
  error,
  isSignedIn,
  userRole,
  onOpenTrip,
}: ExploreWhosGoingPeopleListProps) => {
  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="whos-going" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Loading friends…</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center`}>
        <p className="text-sm font-semibold text-neutral-900">No friends yet</p>
        <p className="mt-1 text-sm text-neutral-600">
          Connect on trips you like — then you&apos;ll see who&apos;s going here.
        </p>
        <Link to="/buddies" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Manage buddies
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const hint = tripHint(row);
        const linkedTrip = row.hosting ?? row.joining;
        return (
          <li
            key={row.buddy.userId}
            className="flex items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-emerald-500/[0.04]"
          >
            <Link to={`/member/${row.buddy.userId}`} className="shrink-0">
              <SecureAvatar
                src={row.buddy.avatarUrl}
                name={row.buddy.displayName}
                className="h-11 w-11 ring-2 ring-white"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to={`/member/${row.buddy.userId}`}
                className="block truncate text-sm font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
              >
                {row.buddy.displayName}
              </Link>
              {hint ? (
                <button
                  type="button"
                  onClick={() => linkedTrip && onOpenTrip(linkedTrip)}
                  className="mt-0.5 block max-w-full truncate text-left text-xs font-medium text-emerald-700 hover:underline"
                >
                  {hint}
                </button>
              ) : (
                <p className="mt-0.5 text-xs text-neutral-500">No upcoming trips on the map</p>
              )}
            </div>
            <Link
              to={messagesRouteForRole(userRole ?? 'participant', row.buddy.userId)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
              aria-label={`Message ${row.buddy.displayName}`}
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
