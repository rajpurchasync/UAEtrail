import { describe, expect, it } from 'vitest';
import {
  UPL_COMPOSE_KIND_ACTIVITY,
  UPL_COMPOSE_KIND_INTENT,
  UPL_COMPOSE_KIND_PLACE,
  UPL_DISCOVER_CREWS,
  UPL_INTENT_OPEN_ACTION,
  UPL_MY_CREWS,
  UPL_OPERATOR_DASHBOARD,
} from './upl-glossary';

describe('UPL compose + operator spine (R6 / PCO-03 contract)', () => {
  it('exposes canonical compose kind labels', () => {
    expect([UPL_COMPOSE_KIND_ACTIVITY, UPL_COMPOSE_KIND_PLACE, UPL_COMPOSE_KIND_INTENT]).toEqual([
      'Activity',
      'Place',
      'Intent',
    ]);
  });

  it('exposes crews + operator member chrome strings', () => {
    expect(UPL_DISCOVER_CREWS).toBe('Discover crews');
    expect(UPL_MY_CREWS).toBe('My crew');
    expect(UPL_OPERATOR_DASHBOARD).toBe('Operator desk');
    expect(UPL_INTENT_OPEN_ACTION).toBe("Share when I'm free");
  });
});