import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { MoreVertical } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';

export type ActivityMenuActionId =
  | 'preview'
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

const MENU_MIN_WIDTH = 176;
const MENU_ITEM_HEIGHT = 40;
const VIEWPORT_PADDING = 8;

export const ActivityActionsMenu = ({ items, align = 'right' }: ActivityActionsMenuProps) => {
  const visible = items.filter((item) => !item.hidden);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
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
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open, align, visible.length]);

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
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
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
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
      id: 'preview',
      label: 'Preview',
      onClick: () => handlers.onPreview?.(activity),
      hidden: !handlers.onPreview,
    },
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
