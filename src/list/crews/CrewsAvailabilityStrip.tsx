import { CalendarPlus } from 'lucide-react';
import { memberAvailabilitySlotsAsDayPicks } from '@uaetrail/shared-types';
import { useMemberAvailability } from '../../hooks/useMemberAvailability';
import { AppButton } from '../../components/mobile/AppButton';
import { UPL_INTENT_OPEN_ACTION } from '../../content/upl-glossary';

type CrewsAvailabilityStripProps = {
  isSignedIn: boolean;
  onEdit: () => void;
};

const summarizeDays = (count: number): string => {
  if (count === 0) return `${UPL_INTENT_OPEN_ACTION} to find crew`;
  if (count === 1) return '1 day marked available';
  return `${count} days marked available`;
};

export const CrewsAvailabilityStrip = ({ isSignedIn, onEdit }: CrewsAvailabilityStripProps) => {
  const { data, loading } = useMemberAvailability(isSignedIn);

  if (!isSignedIn) return null;

  const dayCount = data?.slots?.length
    ? memberAvailabilitySlotsAsDayPicks(data.slots).length
    : 0;
  const summary = loading ? 'Loading your availability…' : summarizeDays(dayCount);

  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 ring-1 ring-neutral-200/80">
      <p className="min-w-0 flex-1 text-sm font-medium text-neutral-800">{summary}</p>
      <AppButton type="button" variant="secondary" className="shrink-0 gap-1 px-3 py-2 text-sm" onClick={onEdit}>
        <CalendarPlus className="h-4 w-4" aria-hidden />
        {dayCount === 0 ? 'Add dates' : 'Edit'}
      </AppButton>
    </div>
  );
};
