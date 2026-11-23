import type { PlanCommitmentFilter } from '../../plan/planTab';
import {
  MemberScheduleCalendar,
  type MemberScheduleCalendarProps,
} from '../../availability/MemberScheduleCalendar';

type PlanCalendarSectionProps = Omit<MemberScheduleCalendarProps, 'scope'> & {
  filter: PlanCommitmentFilter;
};

/** @deprecated Use `MemberScheduleCalendar` with `scope`. */
export const PlanCalendarSection = ({ filter, ...props }: PlanCalendarSectionProps) => (
  <MemberScheduleCalendar {...props} scope={filter} />
);