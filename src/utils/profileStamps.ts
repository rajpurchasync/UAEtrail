import type { RewardSummaryDTO } from '@uaetrail/shared-types';

export type ProfileStampTone = 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'neutral';

export interface ProfileStamp {
  key: string;
  label: string;
  emoji: string;
  tone: ProfileStampTone;
}

export const stampToneClass: Record<ProfileStampTone, string> = {
  emerald: 'bg-emerald-500/12 text-emerald-800 ring-emerald-500/20',
  amber: 'bg-amber-500/12 text-amber-900 ring-amber-500/20',
  blue: 'bg-sky-500/12 text-sky-900 ring-sky-500/20',
  purple: 'bg-violet-500/12 text-violet-900 ring-violet-500/20',
  rose: 'bg-rose-500/12 text-rose-900 ring-rose-500/20',
  neutral: 'bg-neutral-500/10 text-neutral-700 ring-neutral-500/15',
};

export type ProfileHostKind = 'shop' | 'agency' | 'guide' | null;

export const buildProfileStamps = (input: {
  rewardSummary?: RewardSummaryDTO | null;
  attendedCount: number;
  hostedCount: number;
  isHost: boolean;
  hostProfileKind?: ProfileHostKind;
  isGuideStaff?: boolean;
}): ProfileStamp[] => {
  const stamps: ProfileStamp[] = [];
  const seen = new Set<string>();

  const push = (stamp: ProfileStamp) => {
    if (seen.has(stamp.key)) return;
    seen.add(stamp.key);
    stamps.push(stamp);
  };

  const hostKind = input.hostProfileKind ?? null;
  const isShopOwner = hostKind === 'shop';
  const isTripHost = input.isHost && !isShopOwner;

  if (isShopOwner) {
    push({ key: 'shop_owner', label: 'Shop', emoji: '🛍️', tone: 'rose' });
  }

  if (input.isGuideStaff) {
    push({ key: 'guide', label: 'Guide', emoji: '🧭', tone: 'blue' });
  }

  if (isTripHost) {
    push({
      key: 'host',
      label: hostKind === 'agency' ? 'Agency host' : 'Host',
      emoji: '🏔️',
      tone: 'emerald',
    });
    if (input.hostedCount >= 5) {
      push({ key: 'seasoned_host', label: 'Pro host', emoji: '⭐', tone: 'amber' });
    }
  }

  const showParticipantStamp = !isShopOwner && !(isTripHost && input.hostedCount > 0 && input.attendedCount === 0);

  if (showParticipantStamp) {
    if (input.attendedCount >= 10) {
      push({ key: 'seasoned_participant', label: 'Seasoned explorer', emoji: '🥾', tone: 'purple' });
    } else if (input.attendedCount >= 5) {
      push({ key: 'regular_participant', label: 'Regular', emoji: '✓', tone: 'emerald' });
    } else if (input.attendedCount >= 1) {
      push({ key: 'on_the_trail', label: 'On the trail', emoji: '🌱', tone: 'blue' });
    } else {
      push({ key: 'new_explorer', label: 'New explorer', emoji: '👋', tone: 'rose' });
    }
  }

  for (const badge of input.rewardSummary?.tierBadges ?? []) {
    if (!badge.earned) continue;
    push({
      key: badge.key,
      label: badge.name,
      emoji: badge.emoji,
      tone: badge.key === 'goat' ? 'amber' : badge.key === 'pro' ? 'purple' : 'blue',
    });
  }

  for (const badge of input.rewardSummary?.badges ?? []) {
    if (!badge.earned) continue;
    push({ key: badge.key, label: badge.name, emoji: badge.emoji, tone: 'purple' });
  }

  return stamps;
};
