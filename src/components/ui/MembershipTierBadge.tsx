import { Zap, Shield, Crown } from 'lucide-react';
import { MembershipTierKey } from '@uaetrail/shared-types';

const TIER_PILL: Record<MembershipTierKey, string> = {
  free: 'bg-gray-100 text-gray-700 ring-gray-200/80',
  active: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  pro: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  goat: 'bg-amber-50 text-amber-900 ring-amber-200/80',
};

const TIER_ICON: Record<Exclude<MembershipTierKey, 'free'>, typeof Zap> = {
  active: Zap,
  pro: Shield,
  goat: Crown,
};

interface MembershipTierBadgeProps {
  tierKey: MembershipTierKey | string;
  name: string;
  emoji?: string;
  size?: 'sm' | 'md';
  /** @deprecated emoji ignored — lucide icons used */
}

export const MembershipTierBadge = ({ tierKey, name, size = 'sm' }: MembershipTierBadgeProps) => {
  const key = (tierKey in TIER_PILL ? tierKey : 'free') as MembershipTierKey;
  if (key === 'free') return null;

  const Icon = TIER_ICON[key];
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${
        size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
      } ${TIER_PILL[key]}`}
    >
      <Icon className={iconSize} strokeWidth={2.25} aria-hidden />
      {name}
    </span>
  );
};
