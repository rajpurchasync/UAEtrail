import { describe, expect, it } from 'vitest';
import {
  createFlowStepTitle,
  emptyCreateActivityDraft,
  validateDraftStep,
} from '../ui/organizeFlow';

describe('organizeFlow', () => {
  it('uses warm step titles for generic buddy and going from', () => {
    expect(createFlowStepTitle('title', 'hiking', { genericBuddy: true })).toBe('What do you want to do?');
    expect(createFlowStepTitle('meeting', 'hiking')).toBe('Going from');
    expect(createFlowStepTitle('meeting', 'carpool')).toBe('Pickup point');
    expect(createFlowStepTitle('where', 'camping')).toBe('Camp location');
    expect(createFlowStepTitle('where', 'event')).toBe('Going from');
    expect(createFlowStepTitle('instructions', 'hiking')).toBe('Before they join');
  });

  it('validateDraftStep requires a pin on meeting step', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Sunrise hike' };
    expect(validateDraftStep('meeting', draft)).toBe('Drop a pin on the map.');
  });

  it('validateDraftStep requires join rules on hiking information step', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Sunrise hike',
      latitude: 25.1,
      longitude: 55.2,
      additionalInstructions: '',
    };
    expect(validateDraftStep('information', draft)).toBe(
      'Add what joiners need to know before they request a spot.'
    );
  });

  it('validateDraftStep accepts hiking information when join rules present', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Sunrise hike',
      latitude: 25.1,
      longitude: 55.2,
      additionalInstructions: 'Bring water and headlamp.',
      capacity: 6,
    };
    expect(validateDraftStep('information', draft)).toBeNull();
  });
});
