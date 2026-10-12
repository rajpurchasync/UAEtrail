import { describe, expect, it } from 'vitest';
import { emptyProProfileApplicationForm } from './proProfileApplicationForm';
import {
  getHostFlowSteps,
  hostFlowIntentProfileType,
  parseHostFlowIntent,
} from './hostWizardFlow';

describe('hostWizardFlow', () => {
  it('parseHostFlowIntent maps profile add intents', () => {
    expect(parseHostFlowIntent(null)).toBe('pro-application');
    expect(parseHostFlowIntent('become-host')).toBe('pro-application');
    expect(parseHostFlowIntent('add-shop')).toBe('add-shop');
    expect(hostFlowIntentProfileType('add-shop')).toBe('shop');
    expect(hostFlowIntentProfileType('pro-application')).toBeNull();
  });

  it('getHostFlowSteps omits map pin for online-only shops', () => {
    const form = {
      ...emptyProProfileApplicationForm(),
      hostProfileType: 'shop' as const,
      shopPresence: 'online' as const,
    };
    expect(getHostFlowSteps('shop', form)).toEqual([
      'name',
      'about',
      'contact',
      'photo',
      'presence',
      'review',
    ]);
  });
});
