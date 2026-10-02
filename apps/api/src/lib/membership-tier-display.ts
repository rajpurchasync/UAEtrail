/**
 * Legacy `profile.membershipTier` display for reviews/community authors.
 * Trail Points / rewards product removed — hide FREE tier; optional legacy tier chips only.
 */
export const tierEnumToDisplay = (tier: string | null | undefined) => {
  if (!tier || tier === 'FREE') return null;
  const key = tier.toLowerCase();
  const map: Record<string, { key: string; name: string; emoji: string }> = {
    active: { key: 'active', name: 'Active', emoji: '⚡' },
    pro: { key: 'pro', name: 'Pro', emoji: '💎' },
    goat: { key: 'goat', name: 'GOAT', emoji: '🐐' },
  };
  return map[key] ?? null;
};
