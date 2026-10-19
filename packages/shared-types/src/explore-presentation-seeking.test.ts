import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardSections } from './explore-presentation.js';

describe('seeking peek person label', () => {
  it('uses member first name on peek when hostName was Organizer but createdByName is present', () => {
    const sections = buildDiscoveryCardSections({
      source: 'activity',
      activityMode: 'seeking',
      isSeekingPin: true,
      kind: 'hiking',
      title: 'Hiking buddies near Hatta',
      hostName: 'Organizer',
      featuredPerson: {
        userId: 'u1',
        displayName: 'Organizer',
        role: 'requester',
      },
      activity: {
        createdByName: 'Fatima Al Mazrouei',
        tenantName: 'Fatima Al Mazrouei',
        hostName: 'Organizer',
      },
      date: '2026-10-20',
      time: '09:00',
    });

    expect(sections.highlightName).toBe('Fatima');
    expect(sections.suffix).toBe(' is looking for ');
  });
});
