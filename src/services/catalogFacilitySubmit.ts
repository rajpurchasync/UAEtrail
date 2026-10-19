import type { LocationDTO } from '@uaetrail/shared-types';
import { submitMemberFacility } from '../hooks/memberCatalogSubmitClientApi';
import { DEFAULT_COUNTRY } from '../config/regions';
import type { FacilityAddDraft } from '../explore/ui/addFacilityFlow';
import { validateFacilityAddDraft } from '../explore/ui/addFacilityFlow';
import type { AddSubmitResult } from '../explore/ui/addFlow';

/** Member facility submit from Add on map — single `POST /me/facilities`. */
export const submitCatalogFacilityFromAddDraft = async (
  draft: FacilityAddDraft
): Promise<AddSubmitResult> => {
  const validation = validateFacilityAddDraft(draft);
  if (validation) throw new Error(validation);
  if (!draft.facilityKind || !draft.areaId) throw new Error('Complete the form before submitting.');

  const facility = await submitMemberFacility({
    name: draft.title.trim(),
    countryCode: DEFAULT_COUNTRY,
    emirate: draft.emirate.trim(),
    region: draft.emirate.trim(),
    areaId: draft.areaId.trim(),
    activityType: 'event',
    facilityKind: draft.facilityKind,
    description: draft.description.trim(),
    latitude: draft.latitude ?? undefined,
    longitude: draft.longitude ?? undefined,
    images: draft.images,
  });

  const location = {
    id: facility.id,
    name: facility.name,
    activityType: 'event' as const,
    status: facility.status ?? 'draft',
    images: facility.images,
  } as LocationDTO;

  return { kind: 'location', location };
};
