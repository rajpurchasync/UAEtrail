import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageCapabilities } from '../../activity/activityManageCapabilities';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import type { ActivityManageSubview } from './activityManageViews';
import { buildHostManageOptionRows } from './hostManageOptionRows';
import type { ConsumerDetailHostParticipantsSurface } from './ConsumerDetailHostParticipantsSection';

export type ActivityHostManageSurfaceProps = {
  activity: ActivityDTO;
  caps: ActivityManageCapabilities;
  busy?: boolean;
  onSelectSubview: (view: ActivityManageSubview) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onShare?: () => void;
  onChat?: () => void;
} & ConsumerDetailHostParticipantsSurface;

const rowClass =
  'flex w-full min-w-0 items-center gap-3 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-emerald-200/80 hover:bg-emerald-50/40 active:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30';

/** Host manage — outing admin shortcuts (roster lives in {@link ConsumerDetailHostParticipantsSection}). */
export const ConsumerDetailHostManageSection = ({
  activity,
  caps,
  busy = false,
  onSelectSubview,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
  onChat,
}: ActivityHostManageSurfaceProps) => {
  const rows = buildHostManageOptionRows({
    activity,
    caps,
    onSelectSubview,
    onEdit,
    onDuplicate,
    onDelete,
    onShare,
    onChat,
  }).filter((row) => !row.hidden);

  if (rows.length === 0) return null;

  return (
    <ConsumerDetailSection
      id="activity-detail-hosting"
      title="Hosting"
      tone="amber"
      ariaLabel="Hosting actions"
      collapsible
      defaultExpanded
      className="scroll-mt-28 md:scroll-mt-32 lg:scroll-mt-8"
    >
      <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.id} className="min-w-0">
              <button
                type="button"
                disabled={busy}
                className={`${rowClass} ${row.destructive ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}
                onClick={row.onClick}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    row.destructive ? 'bg-red-50 dark:bg-red-950/40' : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <span className="block text-sm font-semibold leading-snug">{row.label}</span>
                  {row.description ? (
                    <span className="mt-0.5 block text-xs leading-snug text-neutral-500 dark:text-neutral-400">
                      {row.description}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ConsumerDetailSection>
  );
};
