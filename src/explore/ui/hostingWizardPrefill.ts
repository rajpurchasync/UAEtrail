import type { CreateActivityDraft } from './hostingFlowEngine';

/** Prefill for explore Host wizards (Host from a past activity or link rideshare). */
export type HostingWizardPrefill = {
  draft: CreateActivityDraft;
  /** Prior activity — publish creates a new row; stored in audit metadata when provided. */
  sourceActivityId?: string;
  /** After publish, link new rideshare to this parent activity id. */
  linkToParentActivityId?: string;
};
