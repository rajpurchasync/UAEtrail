import { describe, expect, it } from 'vitest';

import {

  ADD_COMPOSE_OPTIONS,

  SEEK_FIXED_COMPOSE_OPTIONS,

  HOST_COMPOSE_OPTIONS,

  hostCreateActivityKind,

} from './compose';

import {

  COMPOSE_FLOW_CATALOG,

  composeFlowIdFromRoute,

  composeFlowSpec,

  defaultParticipationForHostRoute,

  seekingKindFromComposeKind,

} from './composeFlowCatalog';

import { normalizeComposeFlowId } from './composeFlowIds';

import { getAddFlowSteps } from './ui/addFlow';

import { SEEKING_TYPE_OPTIONS, getSeekingFlowSteps } from './ui/seekingFlowEngine';

import { getCreateFlowSteps } from './ui/hostingFlowEngine';



describe('compose flow catalog', () => {

  it('maps every FAB host option to host.* flowId', () => {

    for (const option of HOST_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ intent: 'host', kind: option.kind });

      expect(id).toBeTruthy();

      expect(id).toMatch(/^host\./);

      expect(COMPOSE_FLOW_CATALOG[id!].wizard).toBe('hostingFlow');

      expect(COMPOSE_FLOW_CATALOG[id!].intent).toBe('host');

      expect(COMPOSE_FLOW_CATALOG[id!].label.length).toBeGreaterThan(0);

    }

  });



  it('maps every FAB seek option to seek.fixed.* flowId', () => {

    for (const option of SEEK_FIXED_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ intent: 'seek', mode: 'fixed', kind: option.kind });

      expect(id).toBeTruthy();

      expect(id).toMatch(/^seek\.fixed\./);

      expect(COMPOSE_FLOW_CATALOG[id!].wizard).toBe('seekingFlow');

      expect(COMPOSE_FLOW_CATALOG[id!].intent).toBe('seek');

    }

  });



  it('maps every FAB add option to add.* flowId', () => {

    for (const option of ADD_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ intent: 'add', kind: option.kind });

      expect(id).toBeTruthy();

      expect(id).toMatch(/^add\./);

      expect(COMPOSE_FLOW_CATALOG[id!].intent).toBe('add');

    }

  });



  it('parses host rideshare from compose URL', () => {

    expect(composeFlowIdFromRoute({ intent: 'host', kind: 'rideshare' })).toBe(

      'host.rideshare'

    );

  });



  it('maps leftover plan/contribute compose routes to canonical catalog ids', () => {

    expect(

      composeFlowIdFromRoute({ intent: 'plan', kind: 'hiking', mode: 'hosting' })

    ).toBe('host.hiking');

    expect(

      composeFlowIdFromRoute({ intent: 'plan', kind: 'rideshare', mode: 'seeking' })

    ).toBe('seek.fixed.rideshare');

    expect(

      composeFlowIdFromRoute({ intent: 'contribute', target: 'place', kind: 'hiking' })

    ).toBe('add.place.hiking');

  });



  it('normalizes legacy catalog ids to canonical', () => {

    expect(normalizeComposeFlowId('organize.hiking')).toBe('host.hiking');

    expect(normalizeComposeFlowId('plan.hiking.hosting')).toBe('host.hiking');

    expect(normalizeComposeFlowId('host.hiking')).toBe('host.hiking');

    expect(normalizeComposeFlowId('seek.fixed.camping')).toBe('seek.fixed.camping');

    expect(normalizeComposeFlowId('add.place.hiking')).toBe('add.place.hiking');

    expect(composeFlowSpec('organize.hiking').id).toBe('host.hiking');

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

      const id = composeFlowIdFromRoute({ intent: 'host', kind: option.kind });

      expect(id).toBeTruthy();

      const steps = composeFlowSpec(id!).hostingSteps ?? [];

      expect(steps).toContain('audience');

    }

  });



  it('catalog hostingSteps stay aligned with hostingFlow step lists', () => {

    for (const option of HOST_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ intent: 'host', kind: option.kind });

      expect(id).toBeTruthy();

      const createKind = hostCreateActivityKind(option.kind);

      expect(composeFlowSpec(id!).hostingSteps).toEqual(getCreateFlowSteps(createKind, false));

    }

  });



  it('catalog seekingSteps stay aligned with seekingFlowEngine step lists', () => {

    for (const option of SEEK_FIXED_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ intent: 'seek', mode: 'fixed', kind: option.kind });

      expect(id).toBeTruthy();

      const seekingKind = seekingKindFromComposeKind(option.kind);

      expect(composeFlowSpec(id!).seekingSteps).toEqual(getSeekingFlowSteps(seekingKind));

    }

  });



  it('catalog addSteps stay aligned with add-flow step lists', () => {

    for (const option of ADD_COMPOSE_OPTIONS) {

      const id = composeFlowIdFromRoute({ intent: 'add', kind: option.kind });

      expect(id).toBeTruthy();

      expect(composeFlowSpec(id!).addSteps).toEqual(getAddFlowSteps(option.kind));

    }

  });



  it('seeking type picker matches seek FAB options', () => {

    expect(SEEKING_TYPE_OPTIONS.map((row) => row.key)).toEqual(

      SEEK_FIXED_COMPOSE_OPTIONS.map((row) => seekingKindFromComposeKind(row.kind))

    );

    expect(SEEKING_TYPE_OPTIONS.map((row) => row.title)).toEqual(

      SEEK_FIXED_COMPOSE_OPTIONS.map((row) => row.label)

    );

  });

});


