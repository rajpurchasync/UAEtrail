import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle } from 'lucide-react';
import { ConsumerBottomSheet } from '../../mobile/ConsumerBottomSheet';
import { AppButton } from '../../mobile/AppButton';
import { openActivityGroupChat } from '../../../utils/openActivityGroupChat';
import {
  ACTIVITY_DETAIL_GROUP_CHAT_ACTION,
  ACTIVITY_DETAIL_JOIN_WELCOME_TITLE,
  ACTIVITY_DETAIL_MEETING_PLACE_ACTION,
} from '../../../content/activityDetailCopy';
type ActivityDetailJoinWelcomeSheetProps = {
  open: boolean;
  activityId: string;
  detailPath: string;
  onClose: () => void;
  onScrollToMeetingPoint: () => void;
};

/** After instant RSVP — group chat + meeting spot (icon-led, minimal copy). */
export const ActivityDetailJoinWelcomeSheet = ({
  open,
  activityId,
  detailPath,
  onClose,
  onScrollToMeetingPoint,
}: ActivityDetailJoinWelcomeSheetProps) => {
  const navigate = useNavigate();
  const [chatBusy, setChatBusy] = useState(false);

  const openChat = async () => {
    setChatBusy(true);
    try {
      await openActivityGroupChat(navigate, activityId, null, { returnTo: detailPath });
      onClose();
    } finally {
      setChatBusy(false);
    }
  };

  const openMeetingPoint = () => {
    onScrollToMeetingPoint();
    onClose();
  };

  return (
    <ConsumerBottomSheet
      open={open}
      onClose={onClose}
      title={ACTIVITY_DETAIL_JOIN_WELCOME_TITLE}
      subtitle={undefined}
    >
      <div className="grid grid-cols-2 gap-3 px-1 pb-2">
        <button
          type="button"
          disabled={chatBusy}
          onClick={() => void openChat()}
          className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-5 active:bg-neutral-50 disabled:opacity-60"
        >
          <MessageCircle className="h-7 w-7 text-emerald-600" aria-hidden />
          <span className="text-xs font-semibold text-neutral-800">
            {chatBusy ? '…' : ACTIVITY_DETAIL_GROUP_CHAT_ACTION}
          </span>
        </button>
        <button
          type="button"
          onClick={openMeetingPoint}
          className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-5 active:bg-neutral-50"
        >
          <MapPin className="h-7 w-7 text-sky-600" aria-hidden />
          <span className="text-xs font-semibold text-neutral-800">{ACTIVITY_DETAIL_MEETING_PLACE_ACTION}</span>
        </button>
      </div>
      <AppButton type="button" variant="plain" fullWidth className="mt-2" onClick={onClose}>
        Later
      </AppButton>
    </ConsumerBottomSheet>
  );
};
