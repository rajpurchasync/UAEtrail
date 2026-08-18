import { Link } from 'react-router-dom';
import { ChevronRight, MessageSquare, Plus, Users } from 'lucide-react';
import { SocialGroupView } from '../../api/services';
import { AccountSectionHeader } from './AccountSectionHeader';

const typeLabel = {
  family: 'Family',
  friends: 'Friends',
} as const;

interface AccountGroupsPreviewProps {
  groups: SocialGroupView[];
  loading?: boolean;
}

export const AccountGroupsPreview = ({ groups, loading }: AccountGroupsPreviewProps) => {
  const preview = groups.slice(0, 3);

  return (
    <section>
      <AccountSectionHeader
        title="My Groups"
        action={
          <Link to="/groups" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            {groups.length > 0 ? 'See all' : 'Create'}
          </Link>
        }
      />
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <Link
          to="/groups"
          className="glass-card-interactive flex items-center gap-3 p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Create your first group</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Invite family or friends and chat together on trips
            </p>
          </div>
          <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
        </Link>
      ) : (
        <div className="space-y-2">
          {preview.map((group) => (
            <Link
              key={group.id}
              to={`/groups?group=${group.id}`}
              className="glass-card-interactive flex items-center gap-3 p-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center shrink-0 overflow-hidden">
                {group.photoUrl ? (
                  <img src={group.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{group.name}</p>
                <p className="text-xs text-neutral-500">{typeLabel[group.type]} group</p>
              </div>
              <MessageSquare className="w-4 h-4 text-neutral-400 shrink-0" />
              <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
