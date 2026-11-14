/** Group size on join — adults + kids (consumer UI). */
export const GROUP_JOIN_SECTION_LABEL = 'Group join';

export const GROUP_JOIN_MODE_ME = 'Just me';
export const GROUP_JOIN_MODE_HEADCOUNT = 'Headcount';
export const GROUP_JOIN_MODE_TEAM = 'From my team';

export const GROUP_JOIN_JOIN_LEAD =
  'Default is just you. Add a headcount or pick people from your team when you need spots for others.';

export const GROUP_JOIN_EDIT_HEADLINE = 'Group join';

export const GROUP_JOIN_EDIT_LEAD = 'Update headcount if your plans changed.';

export const GROUP_JOIN_APPROVAL_NOTE =
  'Headcount changes are saved on your request. The host may need to approve before spots update.';

export const GROUP_JOIN_SAVING = 'Saving group…';

export const GROUP_JOIN_UPDATE_ERROR = 'Could not update group size.';

export const GROUP_JOIN_KIDS_NOT_ALLOWED =
  'This outing does not allow children. You can only join as an adult.';

export const GROUP_JOIN_INLINE_PREFIX = 'Group';

export const formatGroupJoinSummary = (adults: number, kids: number): string | null => {
  if (adults === 1 && kids === 0) return null;
  const adultPart = `${adults} adult${adults === 1 ? '' : 's'}`;
  const kidPart = kids > 0 ? `, ${kids} kid${kids === 1 ? '' : 's'}` : '';
  return `${adultPart}${kidPart}`;
};