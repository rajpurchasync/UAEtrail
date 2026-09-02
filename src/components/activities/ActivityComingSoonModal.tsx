import { ACTIVITY_TYPE_PICKER_LABELS, type ActivityType } from '../../config/activityTypes';
import { ActivityFormShell } from './ActivityFormShell';

export interface ActivityComingSoonModalProps {
  open: boolean;
  activityType: ActivityType;
  onClose: () => void;
  onBack?: () => void;
}

/** Placeholder form modal for activity types not yet implemented. */
export const ActivityComingSoonModal = ({
  open,
  activityType,
  onClose,
  onBack,
}: ActivityComingSoonModalProps) => {
  if (!open) return null;

  return (
    <ActivityFormShell
      title={`Add ${ACTIVITY_TYPE_PICKER_LABELS[activityType].toLowerCase()}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-white"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
          >
            Close
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-600">
        A dedicated form for {ACTIVITY_TYPE_PICKER_LABELS[activityType].toLowerCase()} is being set up.
      </p>
    </ActivityFormShell>
  );
};
