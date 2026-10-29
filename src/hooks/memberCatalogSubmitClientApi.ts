/**
 * Member catalog **writes** — place submit + facility submit.
 * UI label: FAB **Add on the map** (`CREATE_FLOW.md`). No `/contribute` API.
 * @see docs/SYSTEM_COHERENCE.md §8.4.9
 */
import type { FacilityDTO, LocationDTO, PlaceDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** `POST /me/places` — member place catalog submit (pending moderation). */
export const submitMemberPlace = async (
  payload: Partial<PlaceDTO>,
  tenantId?: string
): Promise<PlaceDTO> => {
  const proposing = Boolean(
    typeof (payload as { proposedAreaName?: string }).proposedAreaName === 'string' &&
      (payload as { proposedAreaName?: string }).proposedAreaName?.trim()
  );
  const res =
    tenantId && !proposing
      ? await api.submitPlace(tenantId, payload)
      : await api.submitUserPlace(payload);
  return res.data;
};

/** `POST /me/facilities` — member facility catalog submit (pending moderation). */
export const submitMemberFacility = async (
  payload: Parameters<typeof api.submitUserFacility>[0]
): Promise<FacilityDTO> => {
  const res = await api.submitUserFacility(payload);
  return res.data;
};

/** `GET /me/places` — caller's submitted place rows (draft / pending). */
export const fetchMyPlaceSubmissions = async (): Promise<LocationDTO[]> => {
  const res = await api.getMySubmittedPlaces();
  return res.data;
};


