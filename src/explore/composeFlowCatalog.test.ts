import { describe, expect, it } from 'vitest';

import {

  CREATE_VENUE_ADD_COMPOSE_OPTIONS,

  AVAILABILITY_FIXED_COMPOSE_OPTIONS,

  HOST_COMPOSE_OPTIONS,

  hostCreateActivityKind,

  placeComposeFromVenueKind,
} from './compose';

import {

  COMPOSE_FLOW_CATALOG,

  composeFlowIdFromRoute,

  composeFlowSpec,

  defaultParticipationForHostRoute,

  availabilityFixedKindFromComposeKind,

} from './composeFlowCatalog';

import { isCanonicalComposeFlowId } from './composeFlowIds';

import { getAddFlowSteps } from './ui/addFlow';

import { AVAILABILITY_FIXED_TYPE_OPTIONS, getAvailabilityFixedFlowSteps } from './ui/availabilityFlowEngine';

import { getCreateFlowSteps } from './ui/hostingFlowEngine';



describe('compose flow catalog', () => {

  it('maps every FAB activity option to activity.* flowId', () => {

    for (const option of HOST_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ composeKind: 'activity', kind: option.kind });

      expect(id).toBeTruthy();

      expect(id).toMatch(/^activity\./);

      expect(COMPOSE_FLOW_CATALOG[id!].wizard).toBe('hostingFlow');

      expect(COMPOSE_FLOW_CATALOG[id!].composeKind).toBe('activity');

      expect(COMPOSE_FLOW_CATALOG[id!].label.length).toBeGreaterThan(0);

    }

  });



  it('maps every FAB intent fixed option to intent.fixed.* flowId', () => {

    for (const option of AVAILABILITY_FIXED_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ composeKind: 'intent', mode: 'fixed', kind: option.kind });

      expect(id).toBeTruthy();

      expect(id).toMatch(/^intent\.fixed\./);

      expect(COMPOSE_FLOW_CATALOG[id!].wizard).toBe('availabilityFlow');

      expect(COMPOSE_FLOW_CATALOG[id!].composeKind).toBe('intent');

    }

  });



  it('maps every FAB place option to place.* flowId', () => {

    for (const option of CREATE_VENUE_ADD_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute(placeComposeFromVenueKind(option.kind));

      expect(id).toBeTruthy();

      expect(id).toMatch(/^place\./);

      expect(COMPOSE_FLOW_CATALOG[id!].composeKind).toBe('place');

    }

  });



  it('parses activity rideshare from compose URL', () => {

    expect(composeFlowIdFromRoute({ composeKind: 'activity', kind: 'rideshare' })).toBe(

      'activity.rideshare'

    );

  });



  it('rejects leftover plan/contribute compose routes', () => {

    expect(

      composeFlowIdFromRoute({ intent: 'plan', kind: 'hiking', mode: 'hosting' } as never)

    ).toBeNull();

    expect(

      composeFlowIdFromRoute({ intent: 'contribute', target: 'place', kind: 'hiking' } as never)

    ).toBeNull();

  });



  it('catalog ids are activity/intent/place only', () => {

    expect(isCanonicalComposeFlowId('activity.hiking')).toBe(true);

    expect(isCanonicalComposeFlowId('intent.fixed.camping')).toBe(true);

    expect(isCanonicalComposeFlowId('place.hiking')).toBe(true);

    expect(isCanonicalComposeFlowId('organize.hiking')).toBe(false);

    expect(isCanonicalComposeFlowId('plan.hiking.hosting')).toBe(false);

  });



  it('catalog default participation matches host events (rsvp) and rideshare (approval)', () => {

    expect(defaultParticipationForHostRoute('event')).toBe('rsvp');

    expect(defaultParticipationForHostRoute('rideshare')).toBe('approval');

  });



  it('catalog default participation is approval for hiking, camping, and activity', () => {

    expect(defaultParticipationForHostRoute('hiking')).toBe('approval');

    expect(defaultParticipationForHostRoute('camping')).toBe('approval');

    expect(defaultParticipationForHostRoute('activity')).toBe('approval');

  });



  it('every hosting flow includes audience step for participation / visibility', () => {

    for (const option of HOST_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ composeKind: 'activity', kind: option.kind });

      expect(id).toBeTruthy();

      const steps = composeFlowSpec(id!).hostingSteps ?? [];

      expect(steps).toContain('audience');

    }

  });



  it('catalog hostingSteps stay aligned with hostingFlow step lists', () => {

    for (const option of HOST_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ composeKind: 'activity', kind: option.kind });

      expect(id).toBeTruthy();

      const createKind = hostCreateActivityKind(option.kind);

      expect(composeFlowSpec(id!).hostingSteps).toEqual(getCreateFlowSteps(createKind, false));

    }

  });



  it('catalog availabilityFixedSteps stay aligned with availabilityFlowEngine step lists', () => {

    for (const option of AVAILABILITY_FIXED_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ composeKind: 'intent', mode: 'fixed', kind: option.kind });

      expect(id).toBeTruthy();

      const fixedKind = availabilityFixedKindFromComposeKind(option.kind);

      expect(composeFlowSpec(id!).availabilityFixedSteps).toEqual(getAvailabilityFixedFlowSteps(fixedKind));

    }

  });



  it('catalog addSteps stay aligned with add-flow step lists', () => {

    for (const option of CREATE_VENUE_ADD_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute(placeComposeFromVenueKind(option.kind));

      expect(id).toBeTruthy();

      expect(composeFlowSpec(id!).addSteps).toEqual(getAddFlowSteps(option.kind));

    }

  });



  it('seeking type picker matches seek FAB options', () => {

    expect(AVAILABILITY_FIXED_TYPE_OPTIONS.map((row) => row.key)).toEqual(

      AVAILABILITY_FIXED_COMPOSE_OPTIONS.map((row) => availabilityFixedKindFromComposeKind(row.kind))

    );

    expect(AVAILABILITY_FIXED_TYPE_OPTIONS.map((row) => row.title)).toEqual(

      AVAILABILITY_FIXED_COMPOSE_OPTIONS.map((row) => row.label)

    );

  });

});


