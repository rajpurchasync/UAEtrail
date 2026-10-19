import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { MoreVertical } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';

export type ActivityMenuActionId =
  | 'manage'
  | 'share'
  | 'preview'
  | 'edit'
  | 'publish'
  | 'duplicate'
  | 'reorganize'
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

const MENU_MIN_WIDTH = 176;
const MENU_ITEM_HEIGHT = 44;
const VIEWPORT_PADDING = 8;

export const ActivityActionsMenu = ({ items, align = 'right' }: ActivityActionsMenuProps) => {
  const visible = items.filter((item) => !item.hidden);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = visible.length * MENU_ITEM_HEIGHT + 8;
    const gap = 4;

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, rect.top - menuHeight - gap);
    }

    let left = align === 'right' ? rect.right - MENU_MIN_WIDTH : rect.left;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, window.innerWidth - MENU_MIN_WIDTH - VIEWPORT_PADDING)
    );

    setMenuStyle({
      position: 'fixed',
      top,
      left,
      minWidth: MENU_MIN_WIDTH,
      zIndex: 200,
    });
  }, [align, visible.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onScrollOrResize = () => setOpen(false);

    document.addEventListener('mousedown', close);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (visible.length === 0) return null;

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={menuStyle}
      className="rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            item.onClick();
          }}
          className={`flex min-h-[44px] w-full items-center px-3 text-left text-sm hover:bg-gray-50 ${
            item.destructive ? 'text-red-600' : 'text-gray-800'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-500 active:bg-gray-100 active:text-gray-800"
        aria-label="Activity options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
};

type HostMenuHandlers = {
  onPreview?: (activity: ActivityDTO) => void;
  onPublish?: (activity: ActivityDTO) => void;
  onDuplicate: (activity: ActivityDTO) => void;
  /** Explore Host wizard prefill — new activity id on publish. */
  onHostFromExisting?: (activity: ActivityDTO) => void;
  onDelete?: (activity: ActivityDTO) => void;
  onCancel?: (activity: ActivityDTO) => void;
  onCheckin?: (activity: ActivityDTO) => void;
  onManage?: (activity: ActivityDTO) => void;
};

/** Row actions for a hosted **activity** (host user console / trips). */
export const buildHostActivityMenuItems = (
  activity: ActivityDTO,
  handlers: HostMenuHandlers
): ActivityMenuItem[] => {
  const status = activity.status;
  const canEdit = status === 'draft' || status === 'published' || status === 'suspended';
  const editOnMap = handlers.onHostFromExisting;

  return [
    {
      id: 'manage',
      label: 'Manage outing',
      onClick: () => handlers.onManage?.(activity),
      hidden: !handlers.onManage,
    },
    {
      id: 'preview',
      label: 'Preview',
      onClick: () => handlers.onPreview?.(activity),
      hidden: !handlers.onPreview,
    },
    {
      id: 'edit',
      label: 'Edit on map',
      onClick: () => editOnMap?.(activity),
      hidden: !canEdit || !editOnMap,
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
    label: activity.featured ? 'Remove from Upcoming rail' : 'Feature on discover (Upcoming)',
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

