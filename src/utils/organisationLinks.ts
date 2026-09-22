export {
  memberProfilePath,
  organisationProfilePath,
  resolveOrganisationProfilePath,
} from '@uaetrail/shared-types';

/** @deprecated Use organisationProfilePath */
export { organisationProfilePath as hostProfilePath } from '@uaetrail/shared-types';

/** Domain alias — prefer in new code. Same URL as memberProfilePath. */
export { memberProfilePath as personProfilePath } from '@uaetrail/shared-types';

/** @deprecated Use resolveOrganisationProfilePath */
export { resolveOrganisationProfilePath as resolveHostProfilePath } from '@uaetrail/shared-types';
