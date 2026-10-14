import { extractActivityIdsFromChatText } from '../../utils/activityShareLink';
import { ChatActivityLinkPreview } from './ChatActivityLinkPreview';

type ChatMessageLinkPreviewsProps = {
  body: string;
  tone?: 'default' | 'onPrimary';
};

export const ChatMessageLinkPreviews = ({ body, tone = 'default' }: ChatMessageLinkPreviewsProps) => {
  const activityIds = extractActivityIdsFromChatText(body);
  if (activityIds.length === 0) return null;

  return (
    <div className="space-y-2">
      {activityIds.map((activityId) => (
        <ChatActivityLinkPreview key={activityId} activityId={activityId} tone={tone} />
      ))}
    </div>
  );
};
