import { MembershipTierDTO } from '@uaetrail/shared-types';
import { ShareButton } from '../ui/ShareButton';
import { GlassCard } from '../mobile/GlassCard';

interface TierUnlockShareCardProps {
  tier: Pick<MembershipTierDTO, 'key' | 'name' | 'emoji' | 'tagline'>;
  referralCode?: string;
}

/** Shareable card when user has unlocked Active, Pro, or GOAT. */
export const TierUnlockShareCard = ({ tier, referralCode }: TierUnlockShareCardProps) => {
  if (tier.key === 'free') return null;

  const sharePath = referralCode ? `/trail-points?ref=${referralCode}` : '/trail-points';
  const shareText = `I reached ${tier.name} tier on UAE Trails by contributing to the UAE outdoor community. Join and earn Trail Points too!`;

  return (
    <GlassCard padding className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">Share your status</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>{tier.emoji}</span>
            {tier.name} member
          </p>
          <p className="text-sm text-gray-600 mt-1">{tier.tagline ?? 'Top contributor on UAE Trails'}</p>
        </div>
        <ShareButton
          title={`I'm ${tier.name} on UAE Trails ${tier.emoji ?? ''}`}
          text={shareText}
          path={sharePath}
          iconOnly
          light
        />
      </div>
    </GlassCard>
  );
};
