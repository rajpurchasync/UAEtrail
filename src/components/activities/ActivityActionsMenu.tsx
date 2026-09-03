import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';

export type ActivityMenuActionId =
  | 'edit'
  | 'publish'
  | 'duplicate'
  | 'delete'
  | 'cancel'
  | 'checkin'
  | 'feature'
  | 'suspend'
  | 'unsuspend';

export type ActivityMenuItem = {
  id: ActivityMenuActionId;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  hidden?: boolean;
};

type ActivityActionsMenuProps = {
  items: ActivityMenuItem[];
  align?: 'left' | 'right';
};

export const ActivityActionsMenu = ({ items, align = 'right' }: ActivityActionsMenuProps) => {
  const visible = items.filter((item) => !item.hidden);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div className="relative inline-flex" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label="Activity options"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-1 z-50 min-w-[11rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                item.destructive ? 'text-red-600' : 'text-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

type HostMenuHandlers = {
  onEdit: (activity: ActivityDTO) => void;
  onPublish?: (activity: ActivityDTO) => void;
  onDuplicate: (activity: ActivityDTO) => void;
  onDelete?: (activity: ActivityDTO) => void;
  onCancel?: (activity: ActivityDTO) => void;
  onCheckin?: (activity: ActivityDTO) => void;
};

export const buildHostActivityMenuItems = (
  activity: ActivityDTO,
  handlers: HostMenuHandlers
): ActivityMenuItem[] => {
  const status = activity.status;
  const canEdit = status === 'draft' || status === 'published' || status === 'suspended';

  return [
    {
      id: 'edit',
      label: 'Edit',
      onClick: () => handlers.onEdit(activity),
      hidden: !canEdit,
    },
    {
      id: 'publish',
      label: 'Publish',
      onClick: () => handlers.onPublish?.(activity),
      hidden: status !== 'draft' || !handlers.onPublish,
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      onClick: () => handlers.onDuplicate(activity),
    },
    {
      id: 'checkin',
      label: 'Check-in',
      onClick: () => handlers.onCheckin?.(activity),
      hidden: status !== 'published' || !handlers.onCheckin,
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: () => handlers.onDelete?.(activity),
      destructive: true,
      hidden: status !== 'draft' || !handlers.onDelete,
    },
    {
      id: 'cancel',
      label: 'Cancel activity',
      onClick: () => handlers.onCancel?.(activity),
      destructive: true,
      hidden: status !== 'published' || !handlers.onCancel,
    },
  ];
};

type AdminMenuHandlers = HostMenuHandlers & {
  onFeature?: (activity: ActivityDTO) => void;
  onSuspend?: (activity: ActivityDTO) => void;
  onUnsuspend?: (activity: ActivityDTO) => void;
  canSuspend?: (activity: ActivityDTO) => boolean;
};

export const buildAdminActivityMenuItems = (
  activity: ActivityDTO,
  handlers: AdminMenuHandlers
): ActivityMenuItem[] => [
  ...buildHostActivityMenuItems(activity, handlers),
  {
    id: 'feature',
    label: activity.featured ? 'Remove featured' : 'Feature on home',
    onClick: () => handlers.onFeature?.(activity),
    hidden: activity.status !== 'published' || !handlers.onFeature,
  },
  {
    id: 'unsuspend',
    label: 'Unsuspend',
    onClick: () => handlers.onUnsuspend?.(activity),
    hidden: activity.status !== 'suspended' || !handlers.onUnsuspend,
  },
  {
    id: 'suspend',
    label: 'Suspend',
    onClick: () => handlers.onSuspend?.(activity),
    destructive: true,
    hidden:
      activity.status !== 'published' ||
      !handlers.onSuspend ||
      handlers.canSuspend?.(activity) === false,
  },
];
