import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import {
  activityDetailQueryKey,
  coordinationAttentionQueryKey,
  myJoinedActivitiesQueryKey,
  myParticipantIntentsQueryKey,
} from './clientQueryKeys';
import { afterOrganizeActivityPublishClientRefresh } from './organizePublishClientEffects';

describe('afterOrganizeActivityPublishClientRefresh (R8.3)', () => {
  it('invalidates plan, coordination, activity detail, and intents when linked', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    await afterOrganizeActivityPublishClientRefresh(queryClient, {
      activityId: 'act-new',
      linkedParticipantIntentId: 'intent-1',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: coordinationAttentionQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: myJoinedActivitiesQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: activityDetailQueryKey('act-new') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: myParticipantIntentsQueryKey() });
    invalidateSpy.mockRestore();
  });
});
