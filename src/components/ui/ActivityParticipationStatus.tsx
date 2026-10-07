import { CheckCircle2, Clock3 } from 'lucide-react';
import { ActivityParticipationDTO } from '@uaetrail/shared-types';

export type ActivityParticipationStatusProps = {
  participation: ActivityParticipationDTO;
  compact?: boolean;
};

const formatCheckInTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Member read-only attendance — hosts confirm via participants roster. */
export const ActivityParticipationStatus = ({
  participation,
  compact = false,
}: ActivityParticipationStatusProps) => {
  if (participation.checkedInAt) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 ${
          compact ? 'px-3 py-2' : 'px-4 py-3'
        }`}
      >
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>Checked in by your host</p>
          <p className="text-xs text-emerald-700/80">{formatCheckInTime(participation.checkedInAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3'
      }`}
    >
      <Clock3 className="w-5 h-5 shrink-0 text-gray-500" />
      <div className="min-w-0">
        <p className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          Confirmed for this activity
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Your host will check you in at the meeting point to confirm attendance.
        </p>
      </div>
    </div>
  );
};
