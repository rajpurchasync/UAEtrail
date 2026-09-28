import { describe, expect, it } from 'vitest';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
} from '@uaetrail/shared-types';
import { OPEN_JOIN_REQUIREMENT } from '../../utils/activityPublishPayload';
import {
  buildOrganizeActivityRequirements,
  createFlowStepTitle,
  emptyCreateActivityDraft,
  getCreateFlowSteps,
  isCampingOrganizeFlow,
  isHikingOrganizeFlow,
  isStructuredOrganizeFlow,
  validateDraftStep,
} from '../ui/organizeFlow';

describe('organizeFlow', () => {
  it('organize hiking uses thirteen confirmed steps incl. difficulty and transportation', () => {
    expect(getCreateFlowSteps('hiking', false)).toHaveLength(13);
    expect(getCreateFlowSteps('hiking', false)).toEqual([
      'title',
      'when',
      'meeting',
      'audience',
      'spots',
      'price',
      'destination',
      'difficulty',
      'about_trail',
      'meeting_point',
      'join_kit',
      'transportation',
      'publish',
    ]);
  });

  it('uses warm step titles for generic buddy and organize hiking', () => {
    expect(createFlowStepTitle('title', 'hiking', { genericBuddy: true })).toBe('What do you want to do?');
    expect(createFlowStepTitle('title', 'hiking')).toBe('Give it a title');
    expect(createFlowStepTitle('spots', 'hiking')).toBe('Participants');
    expect(createFlowStepTitle('when', 'hiking')).toBe('When are you going?');
    expect(createFlowStepTitle('meeting', 'hiking')).toBe('Where are you going from?');
    expect(createFlowStepTitle('join_kit', 'hiking')).toBe('What joiners should bring or know');
    expect(createFlowStepTitle('difficulty', 'hiking')).toBe('How difficult is the hike?');
    expect(createFlowStepTitle('meeting', 'carpool')).toBe('Going from');
    expect(createFlowStepTitle('where', 'camping')).toBe('Camp location');
    expect(createFlowStepTitle('where', 'event')).toBe('Where are you going from?');
    expect(createFlowStepTitle('instructions', 'hiking')).toBe('Before they join');
  });

  it('validateDraftStep requires a pin on meeting step', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Sunrise hike' };
    expect(validateDraftStep('meeting', draft)).toBe('Drop a pin on the map.');
  });

  it('validateDraftStep requires join kit on hiking join_kit step', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Sunrise hike',
      latitude: 25.1,
      longitude: 55.2,
      joinKit: '',
    };
    expect(validateDraftStep('join_kit', draft)).toBe('Add what joiners must bring or know.');
  });

  it('organize camping uses twelve structured steps (aligned with hiking)', () => {
    expect(getCreateFlowSteps('camping', false)).toHaveLength(12);
    expect(getCreateFlowSteps('camping', false)).toEqual([
      'title',
      'when',
      'meeting',
      'audience',
      'spots',
      'price',
      'destination',
      'about_trail',
      'meeting_point',
      'join_kit',
      'transportation',
      'publish',
    ]);
  });

  it('organize rideshare uses ten steps with audience restrictions only', () => {
    expect(getCreateFlowSteps('carpool', false)).toEqual([
      'title',
      'when',
      'meeting',
      'to',
      'audience',
      'spots',
      'price',
      'instructions',
      'transportation',
      'publish',
    ]);
    expect(createFlowStepTitle('meeting', 'carpool')).toBe('Going from');
    expect(createFlowStepTitle('when', 'carpool')).toBe('When are you going?');
  });

  it('organize event uses structured steps without going-from', () => {
    expect(getCreateFlowSteps('event', false)).toEqual([
      'title',
      'when',
      'audience',
      'spots',
      'price',
      'destination',
      'about_trail',
      'meeting_point',
      'join_kit',
      'transportation',
      'publish',
    ]);
    expect(isStructuredOrganizeFlow('event', false)).toBe(true);
  });

  it('uses warm step titles for organize camping', () => {
    expect(createFlowStepTitle('title', 'camping')).toBe('Give it a title');
    expect(createFlowStepTitle('spots', 'camping')).toBe('Participants');
    expect(createFlowStepTitle('destination', 'camping')).toBe('Where are you camping?');
  });

  it('validateDraftStep accepts hiking join_kit when present', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Sunrise hike',
      latitude: 25.1,
      longitude: 55.2,
      joinKit: 'Bring water and headlamp.',
      capacity: 6,
    };
    expect(validateDraftStep('join_kit', draft)).toBeNull();
  });

  it('validateDraftStep accepts camping join_kit when present', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      title: 'Weekend camp',
      latitude: 25.1,
      longitude: 55.2,
      joinKit: 'Bring your own tent.',
      capacity: 6,
    };
    expect(validateDraftStep('join_kit', draft)).toBeNull();
  });

  it('organize activity uses FLOW-05 steps', () => {
    expect(getCreateFlowSteps('activity', false)).toEqual([
      'activity_type',
      'title',
      'when',
      'meeting_point',
      'spots',
      'audience',
      'price',
      'instructions',
      'meeting',
      'transportation',
      'publish',
    ]);
  });

  it('flags structured flow kinds', () => {
    expect(isHikingOrganizeFlow('hiking', false)).toBe(true);
    expect(isCampingOrganizeFlow('camping', false)).toBe(true);
    expect(isStructuredOrganizeFlow('hiking', false)).toBe(true);
    expect(isStructuredOrganizeFlow('camping', false)).toBe(true);
    expect(isStructuredOrganizeFlow('event', false)).toBe(true);
  });

  it('validateDraftStep enforces minimum title length on structured flows', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, title: 'Hi' };
    expect(validateDraftStep('title', draft)).toBe('Title must be at least 4 characters.');
  });

  it('validateDraftStep requires a limited restriction on Participants step', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      capacity: 6,
      participantsOpenToAll: false,
      limitedWomenOnly: false,
      limitedMinAgeEnabled: false,
    };
    expect(validateDraftStep('spots', draft)).toBe('Select at least one restriction under Limited.');
  });

  it('validateDraftStep accepts limited women-only on Participants step', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      capacity: 4,
      participantsOpenToAll: false,
      limitedWomenOnly: true,
    };
    expect(validateDraftStep('spots', draft)).toBeNull();
  });

  it('validateDraftStep enforces about_trail minimum length for hiking and camping', () => {
    const hiking = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      aboutTrail: 'Too short',
    };
    expect(validateDraftStep('about_trail', hiking)).toBe('Description must be at least 20 characters.');

    const camping = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      aboutTrail: 'Short camp note',
    };
    expect(validateDraftStep('about_trail', camping)).toBe('Description must be at least 20 characters.');
  });

  it('validateDraftStep requires manual camp venue name', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      placeLabelSource: 'custom' as const,
      trailName: '',
    };
    expect(validateDraftStep('destination', draft)).toBe('Name the camp or area.');
  });

  it('validateDraftStep requires registry trail pick by default', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      placeLabelSource: 'registry' as const,
      registryPlaceId: null,
    };
    expect(validateDraftStep('destination', draft)).toBe('Choose a trail from the registry.');
  });

  it('validateDraftStep publish checks structured hiking draft end-to-end', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      title: 'Sunrise hike',
      latitude: 25.1,
      longitude: 55.2,
      meetingLatitude: 25.11,
      meetingLongitude: 55.21,
      registryPlaceId: 'trail-registry-1',
      placeLabelSource: 'registry' as const,
      trailName: 'Wadi loop',
      aboutTrail: 'Moderate sunrise loop with steady elevation.',
      joinKit: 'Water, hat, and sturdy shoes.',
      capacity: 8,
    };
    expect(validateDraftStep('publish', draft)).toBeNull();
  });

  it('buildOrganizeActivityRequirements merges approval join lines and participant limits', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      participationMode: 'approval' as const,
      participantsOpenToAll: false,
      limitedWomenOnly: true,
      limitedMinAgeEnabled: true,
      ageMin: 18,
      petsAllowed: false,
      joinKit: 'Headlamp',
    };
    const requirements = buildOrganizeActivityRequirements(draft);
    expect(requirements).toEqual(
      expect.arrayContaining([
        APPROVAL_PARTICIPATION_REQUIREMENT,
        OPEN_JOIN_REQUIREMENT,
        'Women only',
        'Minimum age: 18',
        'No pets',
        'What to bring: Headlamp',
      ])
    );
  });

  it('buildOrganizeActivityRequirements uses RSVP lines when participationMode is rsvp', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'camping' as const,
      participationMode: 'rsvp' as const,
      joinMode: 'open' as const,
    };
    expect(buildOrganizeActivityRequirements(draft)).toContain(RSVP_PARTICIPATION_REQUIREMENT);
  });
});
