import type { CreateActivityDraft } from './organizeFlow';

/** Prefill for explore organize wizards (demand fulfill or reorganize from a past activity). */
export type OrganizeWizardPrefill = {
  draft: CreateActivityDraft;
  participantIntentId?: string;
  /** Prior activity — publish creates a new row; stored in audit metadata when provided. */
  sourceActivityId?: string;
  /** After publish, link new rideshare to this parent activity id. */
  linkToParentActivityId?: string;
};
