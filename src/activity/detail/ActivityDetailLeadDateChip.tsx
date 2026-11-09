import type { ActivityDetailConsumerLeadDate } from '../formatActivityDetailLead';

/** Calendar chip — month + day (weekday is the header label, not a substitute for the date). */
export const ActivityDetailLeadDateChip = ({
  leadDate,
}: {
  leadDate: ActivityDetailConsumerLeadDate;
}) => {
  if (!leadDate.day && !leadDate.month) return null;
  return (
    <div
      className="flex min-h-[4.25rem] w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 px-1.5 py-1.5 text-center text-white shadow-sm lg:min-h-[3.35rem] lg:w-[3.6rem] lg:rounded-lg"
      aria-label={
        [leadDate.weekday, leadDate.day, leadDate.month].filter(Boolean).join(' ') || undefined
      }
    >
      {leadDate.month ? (
        <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-white/90 lg:text-[9px]">
          {leadDate.month}
        </span>
      ) : null}
      {leadDate.day ? (
        <span className="mt-0.5 text-[1.35rem] font-bold leading-none tabular-nums lg:text-lg">
          {leadDate.day}
        </span>
      ) : null}
      {leadDate.weekday ? (
        <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide text-white/85 lg:text-[8px]">
          {leadDate.weekday.slice(0, 3)}
        </span>
      ) : null}
    </div>
  );
};
