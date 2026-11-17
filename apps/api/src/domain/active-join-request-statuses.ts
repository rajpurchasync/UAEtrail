import { ACTIVE_JOIN_REQUEST_WIRE_STATUSES } from '@uaetrail/shared-types';
import { RequestStatus } from './enums.js';

/** Mongo/API SCREAMING statuses for a live join relationship — derived from the wire machine. */
export const ACTIVE_JOIN_REQUEST_STATUSES: RequestStatus[] = ACTIVE_JOIN_REQUEST_WIRE_STATUSES.map(
  (status) => status.toUpperCase() as RequestStatus
);
