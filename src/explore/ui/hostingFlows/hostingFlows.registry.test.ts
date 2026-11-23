import { describe, expect, it } from 'vitest';
import { activitiesHostingFlow } from './activities';
import { campingHostingFlow } from './camping';
import { eventsHostingFlow } from './events';
import { hikingHostingFlow } from './hiking';
import { rideshareHostingFlow } from './rideshare';

describe('organize catalog flows — registry venue step omit', () => {
  const registryDraft = {
    placeLabelSource: 'registry' as const,
    registryPlaceId: 'place-abc',
    communityHostFlow: false,
  };

  it('hiking omits about_trail when registry trail selected but keeps difficulty', () => {
    const steps = hikingHostingFlow.getSteps(registryDraft);
    expect(steps).toContain('difficulty');
    expect(steps).not.toContain('about_trail');
    expect(steps).toContain('destination');
    expect(steps).toContain('meeting_point');
  });

  it('camping omits about_trail when registry camp selected', () => {
    const steps = campingHostingFlow.getSteps(registryDraft);
    expect(steps).not.toContain('about_trail');
    expect(steps).toContain('destination');
  });

  it('events omits about_trail when registry venue selected', () => {
    const steps = eventsHostingFlow.getSteps(registryDraft);
    expect(steps).not.toContain('about_trail');
  });

  it('aligns post-publish carpool on parent hosting flows (not rideshare)', () => {
    expect(hikingHostingFlow.postPublishRideshare).toBe(true);
    expect(activitiesHostingFlow.postPublishRideshare).toBe(true);
    expect(campingHostingFlow.postPublishRideshare).toBe(true);
    expect(eventsHostingFlow.postPublishRideshare).toBe(true);
    expect(rideshareHostingFlow.postPublishRideshare).toBe(false);
  });

  it('keeps full hiking steps for custom venue label', () => {
    const steps = hikingHostingFlow.getSteps({
      placeLabelSource: 'custom',
      registryPlaceId: null,
      communityHostFlow: false,
    });
    expect(steps).toContain('difficulty');
    expect(steps).toContain('about_trail');
  });

  it('organize flows share title → when, then kind-specific third step (rideshare uses meeting)', () => {
    expect(hikingHostingFlow.defaultSteps.slice(0, 3)).toEqual(['title', 'when', 'destination']);
    expect(campingHostingFlow.defaultSteps.slice(0, 3)).toEqual(['title', 'when', 'meeting']);
    expect(eventsHostingFlow.defaultSteps.slice(0, 3)).toEqual(['title', 'when', 'audience']);
    expect(rideshareHostingFlow.defaultSteps).not.toContain('destination');
    expect(rideshareHostingFlow.defaultSteps.slice(0, 3)).toEqual(['title', 'when', 'meeting']);
  });
});
