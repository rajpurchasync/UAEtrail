import { describe, expect, it } from 'vitest';
import { organizeCampingFlow } from './camping';
import { organizeEventsFlow } from './events';
import { organizeHikingFlow } from './hiking';

describe('organize catalog flows — registry venue step omit', () => {
  const registryDraft = {
    placeLabelSource: 'registry' as const,
    registryPlaceId: 'place-abc',
    genericBuddy: false,
  };

  it('hiking omits difficulty and about_trail when registry trail selected', () => {
    const steps = organizeHikingFlow.getSteps(registryDraft);
    expect(steps).not.toContain('difficulty');
    expect(steps).not.toContain('about_trail');
    expect(steps).toContain('destination');
    expect(steps).toContain('meeting_point');
  });

  it('camping omits about_trail when registry camp selected', () => {
    const steps = organizeCampingFlow.getSteps(registryDraft);
    expect(steps).not.toContain('about_trail');
    expect(steps).toContain('destination');
  });

  it('events omits about_trail when registry venue selected', () => {
    const steps = organizeEventsFlow.getSteps(registryDraft);
    expect(steps).not.toContain('about_trail');
  });

  it('keeps full hiking steps for custom venue label', () => {
    const steps = organizeHikingFlow.getSteps({
      placeLabelSource: 'custom',
      registryPlaceId: null,
      genericBuddy: false,
    });
    expect(steps).toContain('difficulty');
    expect(steps).toContain('about_trail');
  });
});
