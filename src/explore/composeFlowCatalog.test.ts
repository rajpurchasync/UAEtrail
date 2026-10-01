import { describe, expect, it } from 'vitest';
import {
  ADD_COMPOSE_OPTIONS,
  FIND_COMPOSE_OPTIONS,
  ORGANIZE_COMPOSE_OPTIONS,
  organizeCreateActivityKind,
} from './compose';
import {
  COMPOSE_FLOW_CATALOG,
  composeFlowIdFromRoute,
  composeFlowSpec,
  defaultParticipationForOrganizeRoute,
  findComposeKindToDemandKind,
} from './composeFlowCatalog';
import { getContributeFlowSteps } from './ui/contributeFlow';
import { DEMAND_TYPE_OPTIONS, getDemandFlowSteps } from './ui/demandFlow';
import { getCreateFlowSteps } from './ui/organizeFlow';

describe('compose flow catalog', () => {
  it('maps every FAB organize option to organize.* flowId', () => {
    for (const option of ORGANIZE_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'organize', kind: option.kind });
      expect(id).toBeTruthy();
      expect(COMPOSE_FLOW_CATALOG[id!].intent).toBe('organize');
      expect(COMPOSE_FLOW_CATALOG[id!].label.length).toBeGreaterThan(0);
    }
  });

  it('maps every FAB find option to find.* flowId', () => {
    for (const option of FIND_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'find', kind: option.kind });
      expect(id).toBeTruthy();
      expect(COMPOSE_FLOW_CATALOG[id!].intent).toBe('find');
    }
  });

  it('maps every FAB add option to add.* flowId', () => {
    for (const option of ADD_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'add', kind: option.kind });
      expect(id).toBeTruthy();
      expect(COMPOSE_FLOW_CATALOG[id!].intent).toBe('add');
    }
  });

  it('parses organize rideshare from compose URL', () => {
    expect(composeFlowIdFromRoute({ intent: 'organize', kind: 'rideshare' })).toBe('organize.rideshare');
  });

  it('catalog default participation matches organize events (rsvp) and rideshare (approval)', () => {
    expect(defaultParticipationForOrganizeRoute('event')).toBe('rsvp');
    expect(defaultParticipationForOrganizeRoute('rideshare')).toBe('approval');
  });

  it('catalog default participation is approval for hiking, camping, and activity', () => {
    expect(defaultParticipationForOrganizeRoute('hiking')).toBe('approval');
    expect(defaultParticipationForOrganizeRoute('camping')).toBe('approval');
    expect(defaultParticipationForOrganizeRoute('activity')).toBe('approval');
  });

  it('every organize flow includes audience step for participation / visibility', () => {
    for (const option of ORGANIZE_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'organize', kind: option.kind });
      expect(id).toBeTruthy();
      const steps = composeFlowSpec(id!).organizeSteps ?? [];
      expect(steps).toContain('audience');
    }
  });

  it('catalog organizeSteps stay aligned with organizeFlow step lists', () => {
    for (const option of ORGANIZE_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'organize', kind: option.kind });
      expect(id).toBeTruthy();
      const createKind = organizeCreateActivityKind(option.kind);
      expect(composeFlowSpec(id!).organizeSteps).toEqual(getCreateFlowSteps(createKind, false));
    }
  });

  it('catalog demandSteps stay aligned with demandFlow step lists', () => {
    for (const option of FIND_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'find', kind: option.kind });
      expect(id).toBeTruthy();
      const demandKind = findComposeKindToDemandKind(option.kind);
      expect(composeFlowSpec(id!).demandSteps).toEqual(getDemandFlowSteps(demandKind));
    }
  });

  it('catalog contributeSteps stay aligned with contributeFlow step lists', () => {
    for (const option of ADD_COMPOSE_OPTIONS) {
      const id = composeFlowIdFromRoute({ intent: 'add', kind: option.kind });
      expect(id).toBeTruthy();
      expect(composeFlowSpec(id!).contributeSteps).toEqual(getContributeFlowSteps(option.kind));
    }
  });

  it('demand type picker matches find FAB options', () => {
    expect(DEMAND_TYPE_OPTIONS.map((row) => row.key)).toEqual(
      FIND_COMPOSE_OPTIONS.map((row) => findComposeKindToDemandKind(row.kind))
    );
    expect(DEMAND_TYPE_OPTIONS.map((row) => row.title)).toEqual(
      FIND_COMPOSE_OPTIONS.map((row) => row.label)
    );
  });
});
