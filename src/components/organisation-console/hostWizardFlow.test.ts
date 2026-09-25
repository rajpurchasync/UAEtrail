import { describe, expect, it } from 'vitest';
import { emptyBecomeHostForm } from './becomeHostForm';
import {
  getHostFlowSteps,
  hostFlowIntentProfileType,
  parseHostFlowIntent,
} from './hostWizardFlow';

describe('hostWizardFlow', () => {
  it('parseHostFlowIntent maps profile add intents', () => {
    expect(parseHostFlowIntent(null)).toBe('become-host');
    expect(parseHostFlowIntent('add-shop')).toBe('add-shop');
    expect(hostFlowIntentProfileType('add-shop')).toBe('shop');
    expect(hostFlowIntentProfileType('become-host')).toBeNull();
  });

  it('getHostFlowSteps omits map pin for online-only shops', () => {
    const form = {
      ...emptyBecomeHostForm(),
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
