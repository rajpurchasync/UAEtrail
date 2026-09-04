import type { ActivityDTO, ActivityDetailDTO, LocationDTO } from '@uaetrail/shared-types';
import { buildActivityDetailFromListItem } from '../../utils/buildActivityDetailPreview';
import { ActivityTripPreviewOverlay } from './ActivityTripPreviewOverlay';

/** Opens the public activity page for published activities. */
export const openPublishedActivityPreview = (activityId: string) => {
  window.open(`/activity/${activityId}`, '_blank', 'noopener,noreferrer');
};

type ActivityListPreviewProps = {
  activity: ActivityDTO | null;
  venue?: LocationDTO;
  saving?: boolean;
  onClose: () => void;
  onEdit?: (activity: ActivityDTO) => void;
  onSaveDraft?: (activity: ActivityDTO) => void;
  onPublish?: (activity: ActivityDTO) => void;
};

export const ActivityListPreview = ({
  activity,
  venue,
  saving = false,
  onClose,
  onEdit,
  onSaveDraft,
  onPublish,
}: ActivityListPreviewProps) => {
  if (!activity) return null;

  const trip: ActivityDetailDTO = buildActivityDetailFromListItem(activity, venue);
  const isDraft = activity.status === 'draft';

  return (
    <ActivityTripPreviewOverlay
      variant="list"
      trip={trip}
      onClose={onClose}
      saving={saving}
      onEdit={!isDraft && onEdit ? () => onEdit(activity) : undefined}
      onSaveDraft={isDraft && onSaveDraft ? () => onSaveDraft(activity) : undefined}
      onPublish={isDraft && onPublish ? () => onPublish(activity) : undefined}
    />
  );
};
