/**
 * @deprecated Import from `./proProfileApplicationForm` (Pro Membership application — not community Organize).
 */
export {
  type ProProfileApplicationFormState as BecomeHostFormState,
  emptyProProfileApplicationForm as emptyBecomeHostForm,
  buildProProfileApplicationFormPrefill as buildBecomeHostFormPrefill,
  buildHostApplicationPayload,
  formatHostPhonePreview,
} from './proProfileApplicationForm';

/** @deprecated Use {@link ProProfileApplicationFormState} from `./proProfileApplicationForm`. */
export type { ProProfileApplicationFormState as BecomeOrganisationFormState } from './proProfileApplicationForm';
export { emptyProProfileApplicationForm as emptyBecomeOrganisationForm } from './proProfileApplicationForm';
export { buildProProfileApplicationFormPrefill as buildBecomeOrganisationFormPrefill } from './proProfileApplicationForm';
export { formatHostPhonePreview as formatOrganisationPhonePreview } from './proProfileApplicationForm';
export { buildHostApplicationPayload as buildOrganisationApplicationPayload } from './proProfileApplicationForm';
