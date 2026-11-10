/** Group size on join — adults + kids (consumer UI). */
export const GROUP_JOIN_SECTION_LABEL = 'Group join';

export const GROUP_JOIN_ADD_FAMILY_CTA = 'Add family';

export const GROUP_JOIN_CHANGE_CTA = 'Change';

export const GROUP_JOIN_JOIN_HEADLINE = 'Who’s in your group?';

export const GROUP_JOIN_EDIT_HEADLINE = 'Group join';

export const GROUP_JOIN_FAMILY_HEADLINE = 'Add family';

export const GROUP_JOIN_JOIN_LEAD =
  'Count everyone in your group — the host uses this for spots and planning.';

export const GROUP_JOIN_EDIT_LEAD = 'Update headcount if your plans changed.';

export const GROUP_JOIN_FAMILY_LEAD = 'Add kids or other adults coming with you.';

export const GROUP_JOIN_KIDS_FAMILY_LABEL = 'Kids & family';

export const GROUP_JOIN_KIDS_NOT_ALLOWED =
  'This outing does not allow children. You can only join as an adult.';

export const GROUP_JOIN_UPDATE_REQUEST_CTA = 'Update request';

export const GROUP_JOIN_APPROVAL_NOTE =
  'Headcount changes are saved on your request. The host may need to approve before spots update.';

export const GROUP_JOIN_SAVING = 'Saving group…';

export const GROUP_JOIN_UPDATE_ERROR = 'Could not update group size.';

export const GROUP_JOIN_INLINE_PREFIX = 'Group';

export const formatGroupJoinSummary = (adults: number, kids: number): string | null => {
  if (adults === 1 && kids === 0) return null;
  const adultPart = `${adults} adult${adults === 1 ? '' : 's'}`;
  const kidPart = kids > 0 ? `, ${kids} kid${kids === 1 ? '' : 's'}` : '';
  return `${adultPart}${kidPart}`;
};

export const formatGroupJoinLine = (adults: number, kids: number): string => {
  const summary = formatGroupJoinSummary(adults, kids);
  if (!summary) return 'Just you';
  return `${GROUP_JOIN_INLINE_PREFIX}: ${summary}`;
};
