import type { ActivityDetailConsumerLeadDate } from '../formatActivityDetailConsumerLead';

/** Emerald date pill — weekday + month + day (consumer detail header). */
export const ConsumerDetailLeadDateChip = ({
  leadDate,
}: {
  leadDate: ActivityDetailConsumerLeadDate;
}) => (
  <div
    className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 px-1.5 py-2 text-center text-white shadow-sm"
    aria-hidden
  >
    <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-50/95">
      {leadDate.weekday}
    </span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/90">
      {leadDate.month}
    </span>
    <span className="text-2xl font-bold leading-none">{leadDate.day}</span>
  </div>
);
