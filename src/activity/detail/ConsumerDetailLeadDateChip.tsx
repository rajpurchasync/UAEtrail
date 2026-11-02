import type { ActivityDetailConsumerLeadDate } from '../formatActivityDetailConsumerLead';

/** Emerald date pill — weekday + month + day (consumer detail header). */
export const ConsumerDetailLeadDateChip = ({
  leadDate,
}: {
  leadDate: ActivityDetailConsumerLeadDate;
}) => (
  <div
    className="flex min-h-[4.25rem] w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 px-1.5 py-2 text-center text-white shadow-sm"
    aria-hidden
  >
    <span className="text-[11px] font-bold leading-tight">{leadDate.label}</span>
  </div>
);
