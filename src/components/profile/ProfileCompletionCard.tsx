import { ChevronRight } from 'lucide-react';
import { GlassCard } from '../mobile/GlassCard';
import type { ProfileCompletionItem } from '../../utils/profileCompletion';

interface ProfileCompletionCardProps {
  percent: number;
  items: ProfileCompletionItem[];
  onEditProfile: () => void;
  onEditAvatar: () => void;
}

export const ProfileCompletionCard = ({
  percent,
  items,
  onEditProfile,
  onEditAvatar,
}: ProfileCompletionCardProps) => {
  if (percent >= 100) return null;

  const nextItem = items.find((item) => !item.done);
  if (!nextItem) return null;

  const handleClick = () => {
    if (nextItem.action === 'avatar') onEditAvatar();
    else onEditProfile();
  };

  return (
    <button type="button" onClick={handleClick} className="block w-full text-left">
      <GlassCard padding className="border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white animate-fade-up">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-sm font-bold text-white">
            {percent}%
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900">Complete your profile</p>
            <p className="mt-0.5 text-xs text-neutral-600">{nextItem.label}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
        </div>
      </GlassCard>
    </button>
  );
};
