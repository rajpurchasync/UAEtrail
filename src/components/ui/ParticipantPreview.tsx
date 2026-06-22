import { PARTICIPANT_PRIVACY } from '../../config/platform';

export interface ParticipantPreviewItem {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ParticipantPreviewProps {
  participants: ParticipantPreviewItem[];
  max?: number;
  size?: 'sm' | 'md';
  showNames?: boolean;
  emptyLabel?: string;
}

const sizeClasses = {
  sm: { avatar: 'w-7 h-7', text: 'text-xs', name: 'text-[11px]' },
  md: { avatar: 'w-8 h-8', text: 'text-xs', name: 'text-xs' },
};

export const ParticipantPreview = ({
  participants,
  max = PARTICIPANT_PRIVACY.maxPreviewCount,
  size = 'sm',
  showNames = false,
  emptyLabel = 'No one confirmed yet',
}: ParticipantPreviewProps) => {
  const styles = sizeClasses[size];
  const preview = participants.slice(0, max);
  const overflow = participants.length - preview.length;

  if (participants.length === 0) {
    return <p className={`${styles.text} text-neutral-400`}>{emptyLabel}</p>;
  }

  if (showNames) {
    return (
      <div className="flex flex-wrap gap-2">
        {preview.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-3 py-1">
            {p.avatar && PARTICIPANT_PRIVACY.showAvatar ? (
              <img src={p.avatar} alt={p.name} className={`${styles.avatar} rounded-full object-cover`} />
            ) : (
              <div
                className={`${styles.avatar} rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 ${styles.text}`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`${styles.name} font-medium text-gray-700 truncate max-w-[120px]`}>{p.name}</span>
          </div>
        ))}
        {overflow > 0 && (
          <span className={`${styles.text} text-gray-500 self-center`}>+{overflow} more</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex -space-x-1.5">
      {preview.map((p) =>
        p.avatar && PARTICIPANT_PRIVACY.showAvatar ? (
          <img
            key={p.id}
            src={p.avatar}
            alt={p.name}
            title={p.name}
            className={`${styles.avatar} rounded-full border-2 border-white object-cover`}
          />
        ) : (
          <div
            key={p.id}
            title={p.name}
            className={`${styles.avatar} rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 ${styles.text}`}
          >
            {p.name.charAt(0).toUpperCase()}
          </div>
        )
      )}
      {overflow > 0 && (
        <div
          className={`${styles.avatar} rounded-full border-2 border-white bg-gray-100 flex items-center justify-center font-bold text-gray-500 ${styles.text}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
