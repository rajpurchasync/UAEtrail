import type { ActivityType } from '../../config/activityTypes';
import { ActivityTypeSelect } from './ActivityTypeSelect';
import { ActivityOwnerField } from './ActivityOwnerField';

export type ActivityIdentityFieldsProps = {
  title: string;
  onTitleChange: (title: string) => void;
  activityType: ActivityType;
  onActivityTypeChange: (type: ActivityType) => void;
  /** Shown on edit when the creator is known. On create, falls back to the signed-in user. */
  ownerName?: string;
};

export const ActivityIdentityFields = ({
  title,
  onTitleChange,
  activityType,
  onActivityTypeChange,
  ownerName,
}: ActivityIdentityFieldsProps) => (
  <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Activity *</label>
      <input
        type="text"
        required
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        placeholder="e.g. Weekend Jebel Jais Hike"
      />
      <p className="text-xs text-gray-500 mt-1">The scheduled outing participants will join.</p>
    </div>

    <ActivityTypeSelect label="Activity Type" value={activityType} onChange={onActivityTypeChange} />

    <ActivityOwnerField ownerName={ownerName} />
  </div>
);
