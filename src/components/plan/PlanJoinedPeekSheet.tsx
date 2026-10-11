import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, MapPin } from 'lucide-react';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { AppButton } from '../mobile/AppButton';
import { activityDetailPath } from '../../config/routingCatalog';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';

type PlanJoinedPeekSheetProps = {
  open: boolean;
  activityId: string | null;
  title: string;
  whenLine?: string | null;
  locationLine?: string | null;
  onClose: () => void;
};

/** Joined outing — quick actions before full activity page. */
export const PlanJoinedPeekSheet = ({
  open,
  activityId,
  title,
  whenLine,
  locationLine,
  onClose,
}: PlanJoinedPeekSheetProps) => {
  const navigate = useNavigate();
  const [chatBusy, setChatBusy] = useState(false);

  const openChat = async () => {
    if (!activityId) return;
    setChatBusy(true);
    try {
      await openActivityGroupChat(navigate, activityId, null, {
        returnTo: activityDetailPath(activityId),
      });
      onClose();
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <ConsumerBottomSheet open={open && Boolean(activityId)} onClose={onClose} title={title} subtitle="Your outing">
      <div className="space-y-4 px-1 pb-2">
        {whenLine ? <p className="text-sm text-neutral-600">{whenLine}</p> : null}
        {locationLine ? (
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {locationLine}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 pt-2">
          <AppButton
            type="button"
            variant="primary"
            onClick={() => {
              if (!activityId) return;
              navigate(activityDetailPath(activityId));
              onClose();
            }}
          >
            View full plan
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            disabled={chatBusy}
            onClick={() => void openChat()}
            className="inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {chatBusy ? 'Opening chat…' : 'Group chat'}
          </AppButton>
        </div>
      </div>
    </ConsumerBottomSheet>
  );
};
