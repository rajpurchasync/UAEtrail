import { afterEach, describe, expect, it } from 'vitest';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
import {
  clearHostingWizardSession,
  findHostingWizardLinkSessionScope,
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
    writeHostingWizardSession('activity.hiking', {
      step: 'when',
      draft,
      selectedKind: 'hiking',
    });
    const saved = readHostingWizardSession('activity.hiking');
    expect(saved?.step).toBe('when');
    expect(saved?.draft.title).toBe('Friday hike');
  });

  it('reads legacy host.* session keys via canonical flow id', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Legacy bucket' };
    sessionStorage.setItem(
      'uaetrail:compose-wizard:host.hiking',
      JSON.stringify({ step: 'title', draft, selectedKind: 'hiking' })
    );
    const saved = readHostingWizardSession('activity.hiking');
    expect(saved?.draft.title).toBe('Legacy bucket');
  });

  it('scopes prefill-linked sessions', () => {
    const scope = hostingWizardSessionScope({ sourceActivityId: 'act-abc' });
    expect(scope).toBe('from:act-abc');
    writeHostingWizardSession(
      'activity.hiking',
      { step: 'title', draft: emptyCreateActivityDraft(), selectedKind: 'hiking' },
      scope
    );
    expect(readHostingWizardSession('activity.hiking')).toBeNull();
    expect(readHostingWizardSession('activity.hiking', scope)?.step).toBe('title');
    clearHostingWizardSession('activity.hiking', scope);
    expect(readHostingWizardSession('activity.hiking', scope)).toBeNull();
  });

  it('finds link session scope for linked rideshare launch', () => {
    const scope = 'link:parent-1';
    writeHostingWizardSession(
      'activity.rideshare',
      {
        step: 'title',
        draft: emptyCreateActivityDraft(),
        selectedKind: 'rideshare',
        linkToParentActivityId: 'parent-1',
      },
      scope
    );
    expect(findHostingWizardLinkSessionScope('activity.rideshare')).toBe(scope);
    expect(readHostingWizardSession('activity.rideshare', scope)?.linkToParentActivityId).toBe(
      'parent-1'
    );
    clearHostingWizardSession('activity.rideshare', scope);
  });

  it('does not read legacy plan.* session keys', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Legacy hike' };
    sessionStorage.setItem(
      'uaetrail:compose-wizard:plan.hiking.hosting',
      JSON.stringify({ step: 'title', draft, selectedKind: 'hiking' })
    );
    expect(readHostingWizardSession('activity.hiking')).toBeNull();
    expect(sessionStorage.getItem('uaetrail:compose-wizard:plan.hiking.hosting')).toBeTruthy();
  });
});