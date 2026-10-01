import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityMenuItem } from '../activities/ActivityActionsMenu';

type TripsHostedMenuHandlers = {
  onOpen: (activity: ActivityDTO) => void;
  onShare?: (activity: ActivityDTO) => void;
  onEdit: (activity: ActivityDTO) => void;
  /** New outing from this one — explore organize (no server draft on Trips). */
  onDuplicate: (activity: ActivityDTO) => void;
  onCancel?: (activity: ActivityDTO) => void;
  onCheckin?: (activity: ActivityDTO) => void;
};

/** Trips → Hosted list & detail overflow menu (Open · Share · …). */
export const buildTripsHostedActivityMenuItems = (
  activity: ActivityDTO,
  handlers: TripsHostedMenuHandlers
): ActivityMenuItem[] => {
  const status = activity.status;
  const canEdit = status === 'published' || status === 'suspended';

  return [
    {
      id: 'preview',
      label: 'Open',
      onClick: () => handlers.onOpen(activity),
    },
    {
      id: 'share',
      label: 'Share',
      onClick: () => handlers.onShare?.(activity),
      hidden: status !== 'published' || !handlers.onShare,
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: () => handlers.onEdit(activity),
      hidden: !canEdit,
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
      id: 'cancel',
      label: 'Cancel activity',
      onClick: () => handlers.onCancel?.(activity),
      destructive: true,
      hidden: status !== 'published' || !handlers.onCancel,
    },
  ];
};
