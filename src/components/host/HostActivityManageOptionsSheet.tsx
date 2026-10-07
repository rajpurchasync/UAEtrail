import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  Car,
  Copy,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import type { HostManageCapabilities } from '../../host/hostActivityManageCapabilities';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import type { HostActivityManageSubview } from './hostActivityManageViews';

type HostActivityManageOptionsSheetProps = {
  open: boolean;
  onClose: () => void;
  activity: ActivityDTO;
  caps: HostManageCapabilities;
  onSelectSubview: (view: HostActivityManageSubview) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type OptionRow = {
  id: string;
  label: string;
  description?: string;
  icon: typeof Users;
  destructive?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

const rowClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-neutral-100 disabled:opacity-50';

/** Manage footer — routes to host sub-views and destructive / duplicate actions. */
export const HostActivityManageOptionsSheet = ({
  open,
  onClose,
  activity,
  caps,
  onSelectSubview,
  onDuplicate,
  onDelete,
}: HostActivityManageOptionsSheetProps) => {
  const published = activity.status === 'published';
  const canDelete = published || activity.status === 'draft';

  const options: OptionRow[] = [
    {
      id: 'participants',
      label: 'View participants',
      description: 'Roster, attendance, chat, revoke',
      icon: Users,
      onClick: () => onSelectSubview('participants'),
    },
    {
      id: 'invite',
      label: 'Invite',
      description: 'Invite crew to join',
      icon: UserPlus,
      hidden: !published,
      onClick: () => onSelectSubview('invite'),
    },
    {
      id: 'rideshare',
      label: 'Rideshare',
      description: 'Link or add a carpool',
      icon: Car,
      hidden: !caps.showLinkRideshare,
      onClick: () => onSelectSubview('rideshare'),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      description: 'New outing from this plan',
      icon: Copy,
      onClick: onDuplicate,
    },
    {
      id: 'delete',
      label: published ? 'Delete outing' : 'Delete draft',
      icon: Trash2,
      destructive: true,
      hidden: !canDelete,
      onClick: onDelete,
    },
  ];

  const visible = options.filter((row) => !row.hidden);

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      title="Manage outing"
      overlayFixed
      showCloseButton
      zClass="z-[1550]"
      maxWidthClass="max-w-md"
    >
      <ul className="space-y-1 px-2 pb-6 pt-1">
        {visible.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.id}>
              <button
                type="button"
                className={`${rowClass} ${row.destructive ? 'text-red-700' : 'text-neutral-900'}`}
                onClick={() => {
                  row.onClick();
                  onClose();
                }}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    row.destructive ? 'bg-red-50' : 'bg-neutral-100'
                  }`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{row.label}</span>
                  {row.description ? (
                    <span className="block text-xs text-neutral-500">{row.description}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ExploreResponsiveSheet>
  );
};
