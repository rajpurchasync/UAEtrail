import type { ActivityType } from '../../config/activityTypes';
import { ActivityTypeSelect } from './ActivityTypeSelect';
import { ActivityOwnerField } from './ActivityOwnerField';

export type ActivityIdentityFieldsProps = {
  title: string;
  onTitleChange: (title: string) => void;
  activityType: ActivityType;
  onActivityTypeChange?: (type: ActivityType) => void;
  /** When set, activity type was chosen earlier and is shown only in the modal title. */
  lockActivityType?: boolean;
  /** Shown on edit when the creator is known. On create, falls back to the signed-in user. */
  ownerName?: string;
};

export const ActivityIdentityFields = ({
  title,
  onTitleChange,
  activityType,
  onActivityTypeChange,
  lockActivityType = false,
  ownerName,
}: ActivityIdentityFieldsProps) => (
  <>
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Activity name *</label>
      <input
        type="text"
        required
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        placeholder="e.g. Weekend Jebel Jais Hike"
      />
    </div>

    {!lockActivityType && onActivityTypeChange && (
      <ActivityTypeSelect label="Activity type" value={activityType} onChange={onActivityTypeChange} />
    )}

    <ActivityOwnerField ownerName={ownerName} />
  </>
);
