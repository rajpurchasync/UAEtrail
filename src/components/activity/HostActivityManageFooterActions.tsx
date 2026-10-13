import { MessageCircle, SlidersHorizontal } from 'lucide-react';
import type { ActivityManageCapabilities } from '../../activity/activityManageCapabilities';

type HostActivityManageFooterActionsProps = {
  caps: ActivityManageCapabilities;
  busy: boolean;
  onChat: () => void;
  onManage: () => void;
};

const actionBtn =
  'flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center transition active:scale-[0.98] disabled:opacity-50';

/** Primary host actions — sticky at the bottom of the manage sheet. */
export const HostActivityManageFooterActions = ({
  caps,
  busy,
  onChat,
  onManage,
}: HostActivityManageFooterActionsProps) => {
  return (
    <div className="border-t border-neutral-200/80 bg-white/95 px-4 pb-safe-plus-3 pt-3 backdrop-blur-md">
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

        <button
          type="button"
          disabled={busy}
          onClick={onManage}
          className={`${actionBtn} bg-neutral-100 text-neutral-900`}
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          <span className="text-xs font-bold">Manage</span>
        </button>
      </div>
    </div>
  );
};
