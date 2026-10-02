/** Subtle, readable name colors for group chat participants (stable per user id). */
const PARTICIPANT_NAME_COLORS = [
  'text-sky-700',
  'text-violet-700',
  'text-amber-800',
  'text-teal-700',
  'text-rose-700',
  'text-indigo-700',
  'text-orange-800',
  'text-cyan-800',
] as const;

export function chatParticipantNameColorClass(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PARTICIPANT_NAME_COLORS.length;
  return PARTICIPANT_NAME_COLORS[index];
}
