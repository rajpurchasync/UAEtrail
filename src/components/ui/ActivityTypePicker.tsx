import { CalendarDays, ChevronRight, Mountain, Tent } from 'lucide-react';
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_DESCRIPTIONS,
  ACTIVITY_TYPE_PICKER_LABELS,
  type ActivityType,
} from '../../config/activityTypes';

interface ActivityTypePickerProps {
  onSelect: (type: ActivityType) => void;
}

const CARD_ICONS: Record<ActivityType, typeof Mountain> = {
  hiking: Mountain,
  camping: Tent,
  event: CalendarDays,
};

const CARD_ACCENTS: Record<ActivityType, string> = {
  hiking: 'bg-emerald-500/12 text-emerald-600',
  camping: 'bg-amber-500/12 text-amber-600',
  event: 'bg-violet-500/12 text-violet-600',
};

export const ActivityTypePicker = ({ onSelect }: ActivityTypePickerProps) => (
  <div className="space-y-3">
    <p className="text-sm text-gray-600">
      Choose Hiking, Camping, or an Event. Each kind has its own form and requirements.
    </p>
    <div className="grid gap-3">
      {ACTIVITY_TYPES.map((type) => {
        const Icon = CARD_ICONS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="group flex items-start gap-4 w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${CARD_ACCENTS[type]}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900">{ACTIVITY_TYPE_PICKER_LABELS[type]}</p>
              <p className="mt-1 text-sm text-gray-600">{ACTIVITY_TYPE_DESCRIPTIONS[type]}</p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-emerald-600" />
          </button>
        );
      })}
    </div>
  </div>
);
