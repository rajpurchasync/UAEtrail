import { GlassCard } from '../mobile/GlassCard';
import type { ProfileCompletionItem } from '../../utils/profileCompletion';

interface ProfileCompletionCardProps {
  percent: number;
  items: ProfileCompletionItem[];
  onEditProfile: () => void;
  onEditAvatar: () => void;
  onOpenSettings?: () => void;
}

export const ProfileCompletionCard = ({
  percent,
  items,
  onEditProfile,
  onEditAvatar,
  onOpenSettings,
}: ProfileCompletionCardProps) => {
  if (percent >= 100) return null;

  const missing = items.filter((item) => !item.done);
  if (missing.length === 0) return null;

  const nextItem = missing[0];

  const handleClick = () => {
    if (nextItem.action === 'avatar') onEditAvatar();
    else if (nextItem.action === 'settings') onOpenSettings?.();
    else onEditProfile();
  };

  return (
    <button type="button" onClick={handleClick} className="block w-full text-left">
      <GlassCard padding className="border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white animate-fade-up">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white">
            {percent}%
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900">Finish your profile</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {missing.slice(0, 3).map((item) => (
                <li key={item.key} className="flex items-center gap-2 text-xs text-neutral-600">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
                  {item.label}
                </li>
              ))}
              {missing.length > 3 && (
                <li className="text-xs font-medium text-neutral-400">+{missing.length - 3} more</li>
              )}
            </ul>
          </div>
          <span className="pt-1 text-lg text-neutral-300" aria-hidden>
            ›
          </span>
        </div>
      </GlassCard>
    </button>
  );
};
