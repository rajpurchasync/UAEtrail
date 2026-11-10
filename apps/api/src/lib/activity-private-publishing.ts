import { ApiError } from './api-error.js';
import { validateMedicalSafetyPhone } from '../domain/member-medical-safety.js';
import type { ActivityPrivateCrewFieldsPatch } from './activity-private-store.js';

export type PublishingActivityPrivateBodySlice = {
  privateEmergencyContactName?: string | null;
  privateEmergencyContactPhone?: string | null;
  privateVehiclePlateNumber?: string | null;
};

const PRIVATE_KEYS: (keyof PublishingActivityPrivateBodySlice)[] = [
  'privateEmergencyContactName',
  'privateEmergencyContactPhone',
  'privateVehiclePlateNumber',
];

export const publishingBodyTouchesPrivateCrewFields = (
  body: PublishingActivityPrivateBodySlice
): boolean => PRIVATE_KEYS.some((k) => k in body);

/**
 * Parses optional `private*` crew fields from publishing create/patch bodies.
 * Returns `undefined` when the client omitted all private fields (no DB touch on patch).
 * Patch: only keys present on the body are applied (others unchanged).
 */
export const parseActivityPrivateCrewFieldsFromPublishingBody = (
  body: PublishingActivityPrivateBodySlice
): ActivityPrivateCrewFieldsPatch | undefined => {
  if (!publishingBodyTouchesPrivateCrewFields(body)) {
    return undefined;
  }

  const patch: ActivityPrivateCrewFieldsPatch = {};

  const nameIn = 'privateEmergencyContactName' in body;
  const phoneIn = 'privateEmergencyContactPhone' in body;
  if (nameIn || phoneIn) {
    if (!nameIn || !phoneIn) {
      throw new ApiError(
        400,
        'private_emergency_contact_incomplete',
        'Provide both private emergency contact name and phone, or clear both.'
      );
    }
    const rawName = body.privateEmergencyContactName;
    const rawPhone = body.privateEmergencyContactPhone;
    const name = rawName === null || rawName === undefined ? '' : String(rawName).trim();
    const phone = rawPhone === null || rawPhone === undefined ? '' : String(rawPhone).trim();
    const hasName = name.length > 0;
    const hasPhone = phone.length > 0;
    if (hasName !== hasPhone) {
      throw new ApiError(
        400,
        'private_emergency_contact_incomplete',
        'Provide both private emergency contact name and phone, or clear both.'
      );
    }
    if (!hasName && !hasPhone) {
      patch.emergencyContact = null;
    } else {
      validateMedicalSafetyPhone(phone);
      patch.emergencyContact = { name, phone };
    }
  }

  if ('privateVehiclePlateNumber' in body) {
    const rawPlate = body.privateVehiclePlateNumber;
    if (rawPlate === null || rawPlate === undefined) {
      patch.plateNumber = null;
    } else {
      const plate = String(rawPlate).trim();
      patch.plateNumber = plate.length > 0 ? plate : null;
    }
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
};
