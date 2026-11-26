import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageCapabilities } from '../../activity/activityManageCapabilities';
import { EXPLORE_SHEET } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from '@/discovery/discoveryPortExploreFlowChrome';
import type { ActivityManageSubview } from './activityManageViews';
import { buildHostManageOptionRows } from './hostManageOptionRows';

type HostActivityManageOptionsSheetProps = {
  open: boolean;
  onClose: () => void;
  activity: ActivityDTO;
  caps: ActivityManageCapabilities;
  onSelectSubview: (view: ActivityManageSubview) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSuspend?: () => void;
  onResume?: () => void;
};

const rowClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-neutral-100 disabled:opacity-50';

/** Manage footer — same catalog-status rows as detail hosting. */
export const HostActivityManageOptionsSheet = ({
  open,
  onClose,
  activity,
  caps,
  onSelectSubview,
  onEdit,
  onDuplicate,
  onDelete,
  onSuspend,
  onResume,
}: HostActivityManageOptionsSheetProps) => {
  const visible = buildHostManageOptionRows({
    activity,
    caps,
    onSelectSubview,
    onEdit,
    onDuplicate,
    onDelete,
    onSuspend,
    onResume,
  }).filter((row) => !row.hidden);

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      title="Manage outing"
      overlayFixed
      showCloseButton
      pullToDismiss
      zClass="z-[1550]"
      maxWidthClass={EXPLORE_SHEET.compactMaxWidth}
    >
      <ul className="space-y-1 px-2 pb-6 pt-1">
        {visible.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.id}>
              <button
                type="button"
                className={`${rowClass} ${row.destructive ? 'text-red-700' : 'text-neutral-900'}`}
                onClick={() => {
                  row.onClick();
                  onClose();
                }}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    row.destructive ? 'bg-red-50' : 'bg-neutral-100'
                  }`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{row.label}</span>
                  {row.description ? (
                    <span className="block text-xs text-neutral-500">{row.description}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ExploreResponsiveSheet>
  );
};
