import type { ReactNode } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { useActivityCrewChatAction } from '../../hooks/useActivityCrewChatAction';
import { usePushEnablePrompt } from '../../hooks/usePushEnablePrompt';

const quickActionClass =
  'flex h-11 min-w-[3.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-neutral-200 bg-white px-2 text-[10px] font-semibold leading-none text-neutral-800 active:bg-neutral-50 disabled:opacity-50';

type ActivityDetailMobileFooterProps = {
  activityId: string;
  /** Confirmed participant — show compact chat / notifications shortcuts. */
  showParticipantShortcuts?: boolean;
  children: ReactNode;
};

/** Slim sticky footer — join/leave primary plus optional icon shortcuts (not full callout cards). */
export const ActivityDetailMobileFooter = ({
  activityId,
  showParticipantShortcuts = false,
  children,
}: ActivityDetailMobileFooterProps) => {
  const chat = useActivityCrewChatAction(activityId);
  const push = usePushEnablePrompt();

  const showChat =
    showParticipantShortcuts && chat.user && !chat.loading && chat.chatAvailable;
  const showPush = showParticipantShortcuts && push.visible;

  return (
    <div className="flex items-stretch gap-2 rounded-2xl bg-white/95 p-2 shadow-lg shadow-black/10 ring-1 ring-black/[0.06] backdrop-blur-md">
      {showChat ? (
        <button
          type="button"
          disabled={chat.busy}
          onClick={() => void chat.openChat()}
          className={quickActionClass}
          aria-label={chat.isMember ? 'Open crew chat' : 'Join crew chat'}
        >
          <MessageCircle className="h-5 w-5 text-emerald-600" aria-hidden />
          Chat
        </button>
      ) : null}
      {showPush ? (
        <button
          type="button"
          disabled={push.loading}
          onClick={() => void push.enable()}
          className={quickActionClass}
          aria-label="Enable notifications"
        >
          <Bell className="h-5 w-5 text-sky-600" aria-hidden />
          Alerts
        </button>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};
