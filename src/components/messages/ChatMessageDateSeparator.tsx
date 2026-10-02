/** Date pill between messages in a thread (direct or group). */
export const ChatMessageDateSeparator = ({ isoDate }: { isoDate: string }) => (
  <div className="flex items-center justify-center my-4">
    <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border">
      {new Date(isoDate).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}
    </span>
  </div>
);

export const shouldShowChatDateSeparator = (
  currentIso: string,
  previousIso: string | undefined
): boolean =>
  !previousIso || new Date(currentIso).toDateString() !== new Date(previousIso).toDateString();
