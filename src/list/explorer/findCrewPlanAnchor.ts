import type { MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';

const SESSION_PREFIX = 'uaetrail:find-crew-plan-anchor:';

export const writeFindCrewPlanAnchorSession = (
  memberUserId: string,
  slot: MemberAvailabilitySlotDTO
): void => {
  const slotId = slot.slotId?.trim();
  if (!slotId || !memberUserId.trim()) return;
  try {
    sessionStorage.setItem(
      `${SESSION_PREFIX}${memberUserId.trim()}:${slotId}`,
      JSON.stringify(slot)
    );
  } catch {
    /* ignore quota */
  }
};

export const readFindCrewPlanAnchorSession = (
  memberUserId: string | null | undefined,
  slotId: string | null | undefined
): MemberAvailabilitySlotDTO | null => {
  if (!memberUserId?.trim() || !slotId?.trim()) return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${memberUserId.trim()}:${slotId.trim()}`);
    if (!raw) return null;
    return JSON.parse(raw) as MemberAvailabilitySlotDTO;
  } catch {
    return null;
  }
};

export const clearFindCrewPlanAnchorSession = (
  memberUserId: string | null | undefined,
  slotId: string | null | undefined
): void => {
  if (!memberUserId?.trim() || !slotId?.trim()) return;
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}${memberUserId.trim()}:${slotId.trim()}`);
  } catch {
    /* ignore */
  }
};