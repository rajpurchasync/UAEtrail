import type { ActivityDTO } from '@uaetrail/shared-types';
import { ClipboardCheck, MessageCircle, Trash2 } from 'lucide-react';
import type { HostManageCapabilities } from '../../host/hostActivityManageCapabilities';

type HostActivityManageTopActionsProps = {
  activity: ActivityDTO;
  caps: HostManageCapabilities;
  view: 'overview' | 'checkin';
  busy: boolean;
  onChat: () => void;
  onCheckIn: () => void;
  onDestructive: () => void;
};

const actionBtn =
  'flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center transition active:scale-[0.98] disabled:opacity-50';

/** Primary host actions — pinned under the sheet header. */
export const HostActivityManageTopActions = ({
  activity,
  caps,
  view,
  busy,
  onChat,
  onCheckIn,
  onDestructive,
}: HostActivityManageTopActionsProps) => {
  const showDestructive = activity.status === 'published';
  const destructiveLabel = showDestructive ? 'Cancel' : null;

  return (
    <div className="border-b border-neutral-100 bg-white px-4 pb-3 pt-1">
      <div className="flex gap-2">
        {caps.showGroupChat ? (
          <button
            type="button"
            disabled={busy}
            onClick={onChat}
            className={`${actionBtn} bg-emerald-600 text-white shadow-sm`}
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            <span className="text-xs font-bold">Chat</span>
          </button>
        ) : null}

        {caps.showCheckIn ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCheckIn}
            aria-current={view === 'checkin' ? 'true' : undefined}
            className={`${actionBtn} ${
              view === 'checkin'
                ? 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30'
                : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            <ClipboardCheck className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            <span className="text-xs font-bold">Check in</span>
          </button>
        ) : null}

        {showDestructive ? (
          <button
            type="button"
            disabled={busy}
            onClick={onDestructive}
            className={`${actionBtn} bg-red-50 text-red-700`}
          >
            <Trash2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            <span className="text-xs font-bold">{destructiveLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
