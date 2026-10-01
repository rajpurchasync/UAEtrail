import { afterEach, describe, expect, it } from 'vitest';
import { emptyCreateActivityDraft } from './organizeFlow';
import {
  clearOrganizeWizardSession,
  organizeWizardSessionScope,
  readOrganizeWizardSession,
  writeOrganizeWizardSession,
} from './composeWizardSession';

describe('composeWizardSession', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('round-trips organize wizard state', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Friday hike' };
    writeOrganizeWizardSession('organize.hiking', {
      step: 'when',
      draft,
      selectedKind: 'hiking',
    });
    const saved = readOrganizeWizardSession('organize.hiking');
    expect(saved?.step).toBe('when');
    expect(saved?.draft.title).toBe('Friday hike');
  });

  it('scopes prefill-linked sessions', () => {
    const scope = organizeWizardSessionScope({ participantIntentId: 'abc' });
    expect(scope).toBe('intent:abc');
    writeOrganizeWizardSession(
      'organize.hiking',
      { step: 'title', draft: emptyCreateActivityDraft(), selectedKind: 'hiking' },
      scope
    );
    expect(readOrganizeWizardSession('organize.hiking')).toBeNull();
    expect(readOrganizeWizardSession('organize.hiking', scope)?.step).toBe('title');
    clearOrganizeWizardSession('organize.hiking', scope);
    expect(readOrganizeWizardSession('organize.hiking', scope)).toBeNull();
  });
});
