import { afterEach, describe, expect, it } from 'vitest';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
import {
  clearHostingWizardSession,
  hostingWizardSessionScope,
  readHostingWizardSession,
  writeHostingWizardSession,
} from './composeWizardSession';

describe('composeWizardSession', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('round-trips hosting wizard state', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Friday hike' };
    writeHostingWizardSession('host.hiking', {
      step: 'when',
      draft,
      selectedKind: 'hiking',
    });
    const saved = readHostingWizardSession('host.hiking');
    expect(saved?.step).toBe('when');
    expect(saved?.draft.title).toBe('Friday hike');
  });

  it('scopes prefill-linked sessions', () => {
    const scope = hostingWizardSessionScope({ participantIntentId: 'abc' });
    expect(scope).toBe('intent:abc');
    writeHostingWizardSession(
      'host.hiking',
      { step: 'title', draft: emptyCreateActivityDraft(), selectedKind: 'hiking' },
      scope
    );
    expect(readHostingWizardSession('host.hiking')).toBeNull();
    expect(readHostingWizardSession('host.hiking', scope)?.step).toBe('title');
    clearHostingWizardSession('host.hiking', scope);
    expect(readHostingWizardSession('host.hiking', scope)).toBeNull();
  });

  it('inbound-rewrites leftover plan.* session keys', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Legacy hike' };
    sessionStorage.setItem(
      'uaetrail:compose-wizard:plan.hiking.hosting',
      JSON.stringify({ step: 'title', draft, selectedKind: 'hiking' })
    );
    const saved = readHostingWizardSession('host.hiking');
    expect(saved?.draft.title).toBe('Legacy hike');
    expect(sessionStorage.getItem('uaetrail:compose-wizard:host.hiking')).toBeTruthy();
    expect(sessionStorage.getItem('uaetrail:compose-wizard:plan.hiking.hosting')).toBeNull();
  });
});
