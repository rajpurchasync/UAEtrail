/**
 * Member catalog **writes** — place submit + facility submit.
 * UI label: FAB **Contribute** (`CREATE_FLOW.md`). No `/contribute` API.
 * @see docs/SYSTEM_COHERENCE.md §8.4.9
 */
import type { FacilityDTO, LocationDTO, PlaceDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** `POST /me/places` — member place catalog submit (pending moderation). */
export const submitMemberPlace = async (
  payload: Partial<PlaceDTO>,
  tenantId?: string
): Promise<PlaceDTO> => {
  const res = tenantId
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

/** @deprecated Use {@link submitMemberPlace}. */
export const submitPlaceContribution = submitMemberPlace;

/** @deprecated Use {@link submitMemberPlace}. */
export const submitUserLocationContribution = async (
  payload: Partial<LocationDTO>
): Promise<LocationDTO> => {
  const res = await api.submitUserPlace(payload);
  return res.data;
};

/** @deprecated Use {@link submitMemberFacility}. */
export const submitUserFacilityContribution = submitMemberFacility;

/** @deprecated Use {@link fetchMyPlaceSubmissions}. */
export const fetchMySubmittedPlaces = fetchMyPlaceSubmissions;
