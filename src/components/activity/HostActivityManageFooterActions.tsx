import { MessageCircle, Share2, SlidersHorizontal } from 'lucide-react';
import type { ActivityManageCapabilities } from '../../activity/activityManageCapabilities';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';

type HostActivityManageFooterActionsProps = {
  caps: ActivityManageCapabilities;
  busy: boolean;
  showShare?: boolean;
  onOpenShare?: () => void;
  onChat: () => void;
  onManage: () => void;
};

const footerTile =
  'flex min-h-[3rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-neutral-200/90 bg-white px-2 py-2 text-center text-[11px] font-semibold leading-tight text-neutral-800 active:bg-neutral-100 disabled:opacity-50';

const chatTile = `${EXPLORE_PEEK_CTA.peekJoin} flex flex-1 flex-row items-center justify-center gap-2 !min-h-[3rem] !rounded-xl !py-2`;

/** Primary host actions — sticky at the bottom of the manage sheet. */
export const HostActivityManageFooterActions = ({
  caps,
  busy,
  showShare = false,
  onOpenShare,
  onChat,
  onManage,
}: HostActivityManageFooterActionsProps) => {
  return (
    <div className="px-4 pb-safe-plus-3 pt-2">
      <div className="rounded-2xl bg-white/95 p-2 shadow-lg shadow-black/10 ring-1 ring-black/[0.06] backdrop-blur-md">
        <div className="flex gap-2">
          {showShare && onOpenShare ? (
            <button
              type="button"
              disabled={busy}
              onClick={onOpenShare}
              className={footerTile}
            >
              <Share2 className="h-5 w-5 shrink-0 text-emerald-700" strokeWidth={2.25} aria-hidden />
              Share
            </button>
          ) : null}

          {caps.showGroupChat ? (
            <button type="button" disabled={busy} onClick={onChat} className={chatTile}>
              <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="text-[13px] font-bold">Chat</span>
            </button>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={onManage}
            className={`${footerTile} ${!showShare && !caps.showGroupChat ? 'flex-[2]' : ''}`}
          >
            <SlidersHorizontal className="h-5 w-5 shrink-0 text-emerald-700" strokeWidth={2.25} aria-hidden />
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};
