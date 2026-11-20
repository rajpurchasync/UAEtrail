import { Calendar, MessageSquare, Settings2, UserRound, Users } from 'lucide-react';
import type { SocialGroupMemberView, SocialGroupView } from '../../api/types';
import { groupsManagePath } from '../../config/routingCatalog';
import { activitySharePath } from '../../utils/activityShare';
import { groupWallPostPolicyLabel, resolveGroupWallPostPolicy } from '../../utils/groupWallPostPolicy';
import { isSocialGroupAdmin } from '../../utils/socialGroupAdmin';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ChatActivityLinkPreview } from './ChatActivityLinkPreview';
import { ChatThreadSummarySheet } from './ChatThreadSummarySheet';
import { MessageAvatar } from './ChatMessageAvatar';

type ChatGroupSummarySheetProps = {
  open: boolean;
  onClose: () => void;
  group: SocialGroupView;
  members: SocialGroupMemberView[];
  membership: SocialGroupMemberView | null;
  currentUserId: string | undefined;
  onShowParticipants: () => void;
  onEditChatSettings: () => void;
  /** Hub-only — omit in the live thread header sheet. */
  onOpenChat?: () => void;
};

export const ChatGroupSummarySheet = ({
  open,
  onClose,
  group,
  members,
  membership,
  currentUserId,
  onShowParticipants,
  onEditChatSettings,
  onOpenChat,
}: ChatGroupSummarySheetProps) => {
  const activeCount = members.filter((m) => m.memberType === 'adult' && m.isActive !== false).length;
  const postPolicy = resolveGroupWallPostPolicy(group);
  const admin = isSocialGroupAdmin(group, membership, currentUserId);
  const isActivity = group.kind === 'outing_crew' || group.type === 'activity' || group.type === 'outing_crew';
  const activityId = group.activityId?.trim() || null;

  const actions = [
    ...(onOpenChat
      ? [
          {
            label: 'Open chat',
            icon: <MessageSquare className="h-4 w-4" aria-hidden />,
            variant: 'primary' as const,
            onClick: onOpenChat,
          },
        ]
      : []),
    ...(isActivity && activityId
      ? [
          {
            label: 'View outing',
            icon: <Calendar className="h-4 w-4" aria-hidden />,
            variant: onOpenChat ? ('secondary' as const) : ('primary' as const),
            to: activitySharePath(activityId),
          },
        ]
      : []),
    {
      label: 'View participants',
      icon: <Users className="h-4 w-4" aria-hidden />,
      variant:
        onOpenChat || (isActivity && activityId) ? ('secondary' as const) : ('primary' as const),
      onClick: () => {
        onClose();
        onShowParticipants();
      },
    },
    ...(admin && !isActivity
      ? [
          {
            label: 'Edit group',
            icon: <UserRound className="h-4 w-4" aria-hidden />,
            variant: 'secondary' as const,
            to: groupsManagePath(group.id, 'edit'),
          },
        ]
      : []),
    ...(admin
      ? [
          {
            label: 'Permissions',
            icon: <Settings2 className="h-4 w-4" aria-hidden />,
            variant: 'secondary' as const,
            onClick: () => {
              onClose();
              onEditChatSettings();
            },
          },
        ]
      : []),
  ];

  const detail = (
    <>
      {isActivity && activityId ? (
        <div className="flex justify-center">
          <ChatActivityLinkPreview activityId={activityId} />
        </div>
      ) : null}
    </>
  );

  const hasDetail = Boolean(isActivity && activityId);

  return (
    <ChatThreadSummarySheet
      open={open}
      onClose={onClose}
      title={group.name}
      subtitle={
        <>
          {activeCount} participant{activeCount === 1 ? '' : 's'} · {groupWallPostPolicyLabel[postPolicy]}
        </>
      }
      leading={
        group.photoUrl ? (
          <MessageAvatar name={group.name} url={group.photoUrl} size="lg" />
        ) : (
          <SecureAvatar name={group.name} className="h-20 w-20 text-xl bg-emerald-100 text-emerald-700" />
        )
      }
      detail={hasDetail ? detail : undefined}
      actions={actions}
    />
  );
};
