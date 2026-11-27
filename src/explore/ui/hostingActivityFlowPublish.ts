import type { QueryClient } from '@tanstack/react-query';
import type { ActivityDTO, PlaceDTO } from '@uaetrail/shared-types';
import {
  publishHostingActivity,
  updateHostingActivity,
} from '../../services/hostingActivityPublish';
import { afterHostingActivityPublishClientRefresh } from '../../hooks/hostingPublishClientEffects';
import { validateHostingPlaceDestination } from '../hostingPublishDestination';
import { HOSTING_PROFILE_INCOMPLETE_ERROR } from '../createFlowCopy';
import {
  clearHostingWizardSession,
  readHostingWizardSession,
} from './composeWizardSession';
import { normalizeComposeFlowId } from '../composeFlowIds';
import { validateDraftStep, type CreateActivityDraft, type CreateActivityKind } from './hostingFlowEngine';
import type { HostingWizardPrefill } from './hostingWizardPrefill';

export type HostingActivityFlowPublishInput = {
  userId: string;
  tenantId: string | null | undefined;
  draft: CreateActivityDraft;
  selectedKind: CreateActivityKind | null;
  catalogPlaces: PlaceDTO[];
  editActivity: ActivityDTO | null | undefined;
  wizardPrefill: HostingWizardPrefill | null | undefined;
  hostingFlowId: string | null;
  wizardSessionScope: string | undefined;
  queryClient: QueryClient;
};

export type HostingActivityFlowPublishResult =
  | { outcome: 'updated'; activity: ActivityDTO }
  | { outcome: 'created'; activity: ActivityDTO }
  | { outcome: 'validation_error'; message: string }
  | { outcome: 'publish_error'; message: string };

export const runHostingActivityFlowPublish = async (
  input: HostingActivityFlowPublishInput
): Promise<HostingActivityFlowPublishResult> => {
  if (!input.tenantId) {
    return { outcome: 'validation_error', message: HOSTING_PROFILE_INCOMPLETE_ERROR };
  }

  const validation = validateDraftStep('publish', input.draft);
  if (validation) {
    return { outcome: 'validation_error', message: validation };
  }

  const placeAreaValidation = validateHostingPlaceDestination(input.draft, input.catalogPlaces);
  if (placeAreaValidation) {
    return { outcome: 'validation_error', message: placeAreaValidation };
  }

  const normalizedDraft = {
    ...input.draft,
    kind: input.draft.kind ?? input.selectedKind,
    rideshareEnabled: false as const,
  };

  try {
    if (input.editActivity) {
      const updated = await updateHostingActivity({
        activityId: input.editActivity.id,
        draft: normalizedDraft,
        tenantId: input.tenantId,
        userId: input.userId,
      });
      await afterHostingActivityPublishClientRefresh(input.queryClient, {
        activityId: updated.id,
        userId: input.userId,
      });
      return { outcome: 'updated', activity: updated };
    }

    const hostingFlowId = input.hostingFlowId
      ? normalizeComposeFlowId(input.hostingFlowId)
      : null;
    const activity = await publishHostingActivity({
      draft: normalizedDraft,
      tenantId: input.tenantId,
      userId: input.userId,
      sourceActivityId: input.wizardPrefill?.sourceActivityId ?? null,
      linkToParentActivityId:
        input.wizardPrefill?.linkToParentActivityId ??
        (hostingFlowId
          ? readHostingWizardSession(hostingFlowId, input.wizardSessionScope)?.linkToParentActivityId
          : null) ??
        null,
    });
    await afterHostingActivityPublishClientRefresh(input.queryClient, {
      activityId: activity.id,
      userId: input.userId,
    });
    if (hostingFlowId) {
      clearHostingWizardSession(hostingFlowId, input.wizardSessionScope);
    }
    return { outcome: 'created', activity };
  } catch (err) {
    return {
      outcome: 'publish_error',
      message: err instanceof Error ? err.message : 'Could not publish. Try again.',
    };
  }
};