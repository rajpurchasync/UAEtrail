/**
 * Crew-only fields accepted on POST/PATCH `/publishing/activities`.
 * Stored in `activity_private`; merged onto crew/trusted activity reads as `activityPrivateDetails`.
 *
 * PATCH: omit a key to leave it unchanged; send both name and phone together to set or clear emergency contact.
 */
export type PublishingActivityPrivateCrewBodyFields = {
  privateEmergencyContactName?: string | null;
  privateEmergencyContactPhone?: string | null;
  privateVehiclePlateNumber?: string | null;
};

/** Arbitrary publishing activity body (create/patch) plus typed private crew keys. */
export type PublishingActivityUpsertBody = Record<string, unknown> &
  PublishingActivityPrivateCrewBodyFields;
