import type { CreateActivityDraft } from './hostingFlowEngine';

/** Prefill for explore Host wizards (seeking offer or Host from a past activity). */
export type HostingWizardPrefill = {
  draft: CreateActivityDraft;
  participantIntentId?: string;
  /** Prior activity — publish creates a new row; stored in audit metadata when provided. */
  sourceActivityId?: string;
  /** After publish, link new rideshare to this parent activity id. */
  linkToParentActivityId?: string;
};
