import { X } from 'lucide-react';
import type { SocialGroupMemberView, SocialGroupView } from '../../api/types';
import { SecureAvatar } from '../ui/SecureAvatar';

type GroupWallMembersSheetProps = {
  open: boolean;
  onClose: () => void;
  group: SocialGroupView;
  members: SocialGroupMemberView[];
};

const memberLabel = (group: SocialGroupView, member: SocialGroupMemberView) => {
  if (member.userId === group.adminUserId) return 'Host';
  if (member.role === 'admin') return 'Admin';
  return 'Member';
};

export const GroupWallMembersSheet = ({ open, onClose, group, members }: GroupWallMembersSheetProps) => {
  if (!open) return null;

  const adults = members.filter((m) => m.memberType === 'adult' && m.isActive !== false);

  return (
    <div className="fixed inset-0 z-[1400] flex flex-col justify-end bg-black/40" role="dialog" aria-modal="true">
      <button type="button" className="flex-1" aria-label="Close participants" onClick={onClose} />
      <div className="max-h-[70dvh] rounded-t-2xl bg-white shadow-xl pb-safe">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">Participants ({adults.length})</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="overflow-y-auto p-2">
          {adults.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-neutral-50"
            >
              <SecureAvatar
                src={member.user?.avatarUrl}
                name={member.user?.displayName || member.user?.email || 'Member'}
                className="h-10 w-10 shrink-0 text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {member.user?.displayName || member.user?.email || 'Member'}
                </p>
                <p className="text-xs text-neutral-500">{memberLabel(group, member)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
