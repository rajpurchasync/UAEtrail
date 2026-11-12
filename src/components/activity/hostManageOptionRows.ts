import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  Car,
  Copy,
  MessageCircle,
  PauseCircle,
  Pencil,
  PlayCircle,
  Share2,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import type { ActivityManageCapabilities } from '../../activity/activityManageCapabilities';
import type { ActivityManageSubview } from './activityManageViews';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ACTIVITY_PARTICIPANTS_SECTION_LABEL } from '../../content/activityParticipantsCopy';

export type HostManageOptionRow = {
  id: string;
  label: string;
  description?: string;
  icon: typeof Users;
  destructive?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

export const buildHostManageOptionRows = (input: {
  activity: ActivityDTO;
  caps: ActivityManageCapabilities;
  onSelectSubview: (view: ActivityManageSubview) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSuspend?: () => void;
  onResume?: () => void;
  onShare?: () => void;
  onChat?: () => void;
}): HostManageOptionRow[] => {
  const { activity, caps } = input;
  const published = activity.status === 'published';
  const suspended = activity.status === 'suspended';
  const canDelete = published || activity.status === 'draft' || suspended;
  const canEdit = activity.status === 'draft' || published;

  return [
    {
      id: 'edit',
      label: 'Edit outing',
      description: 'Date, place, capacity, and join rules',
      icon: Pencil,
      hidden: !canEdit,
      onClick: input.onEdit,
    },
    {
      id: 'resume',
      label: 'Resume outing',
      description: 'Show again on the map and in search',
      icon: PlayCircle,
      hidden: !suspended || !input.onResume,
      onClick: () => input.onResume?.(),
    },
    {
      id: 'participants',
      label: ACTIVITY_PARTICIPANTS_SECTION_LABEL,
      description: 'Roster, attendance, chat, revoke',
      icon: Users,
      onClick: () => input.onSelectSubview('participants'),
    },
    {
      id: 'invite',
      label: ACTIVITY_INVITE_FRIENDS_CTA,
      description: 'Invite friends to join',
      icon: UserPlus,
      hidden: !published,
      onClick: () => input.onSelectSubview('invite'),
    },
    {
      id: 'rideshare',
      label: 'Rideshare',
      description: 'Link or add a carpool',
      icon: Car,
      hidden: !caps.showLinkRideshare,
      onClick: () => input.onSelectSubview('rideshare'),
    },
    {
      id: 'share',
      label: 'Share outing',
      description: 'Link and buddy invites',
      icon: Share2,
      hidden: !published || !input.onShare,
      onClick: () => input.onShare?.(),
    },
    {
      id: 'chat',
      label: 'Message crew',
      description: 'Group chat for this outing',
      icon: MessageCircle,
      hidden: !caps.showGroupChat || !input.onChat,
      onClick: () => input.onChat?.(),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      description: 'New outing from this plan',
      icon: Copy,
      onClick: input.onDuplicate,
    },
    {
      id: 'suspend',
      label: 'Suspend outing',
      description: 'Hide from map and visitor search',
      icon: PauseCircle,
      destructive: true,
      hidden: !published || !input.onSuspend,
      onClick: () => input.onSuspend?.(),
    },
    {
      id: 'delete',
      label: suspended ? 'Delete outing' : published ? 'Delete outing' : 'Delete draft',
      icon: Trash2,
      destructive: true,
      hidden: !canDelete,
      onClick: input.onDelete,
    },
  ];
};
