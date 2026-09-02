import { ActivityTypePicker } from '../ui/ActivityTypePicker';
import { Dialog } from '../ui/Dialog';
import type { ActivityType } from '../../config/activityTypes';

export interface ActivityTypePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ActivityType) => void;
}

/** Step 1 — designed card picker. Separate modal from activity forms. */
export const ActivityTypePickerModal = ({ open, onClose, onSelect }: ActivityTypePickerModalProps) => {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Add activity" className="max-w-lg">
      <ActivityTypePicker onSelect={onSelect} />
      <button type="button" onClick={onClose} className="mt-4 w-full text-sm text-gray-500 py-1">
        Cancel
      </button>
    </Dialog>
  );
};
