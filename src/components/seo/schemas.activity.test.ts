import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityEventSchema } from './schemas';

const baseActivity = (): ActivityDetailDTO =>
  ({
    id: 'a1',
    tenantId: 't1',
    tenantSlug: 'host',
    locationId: 'loc1',
    title: 'Sunrise hike',
    activityType: 'hiking',
    locationName: 'Secret wadi parking',
    region: 'Dubai',
    description: 'Meet at grid ref 25.123 — gate code 4455',
    date: '2026-11-01',
    time: '06:00',
    meetingPoint: 'Exact pin — do not share',
    meetingLat: 25.1,
    meetingLng: 55.2,
    price: 0,
    slotsTotal: 10,
    slotsAvailable: 8,
    status: 'published',
    joinMode: 'open',
    participationMode: 'rsvp',
  }) as ActivityDetailDTO;

describe('activityEventSchema', () => {
  it('does not expose meeting point or coordinates in JSON-LD location', () => {
    const schema = activityEventSchema(baseActivity());
    const location = schema.location as { name?: string };
    expect(location.name).toBe('Dubai');
    expect(JSON.stringify(schema)).not.toContain('meetingPoint');
    expect(JSON.stringify(schema)).not.toContain('25.1');
    expect(JSON.stringify(schema)).not.toContain('gate code');
  });
});
