import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, type ActivityType } from '../../config/activityTypes';

interface ActivityTypeSelectProps {
  value: ActivityType;
  onChange: (type: ActivityType) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export const ActivityTypeSelect = ({
  value,
  onChange,
  disabled = false,
  label = 'Activity type',
  required = true,
}: ActivityTypeSelectProps) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-2 block">
      {label}
      {required ? ' *' : ''}
    </label>
    <div className="flex gap-2 flex-wrap">
      {ACTIVITY_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className={`flex-1 min-w-[7rem] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
            value === type
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {ACTIVITY_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  </div>
);
