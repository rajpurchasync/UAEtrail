import { describe, expect, it } from 'vitest';
import { assertCapacityAvailable } from '../src/domain/capacity.js';

describe('capacity checks', () => {
  it('allows when slots are available', () => {
    expect(() => assertCapacityAvailable(10, 5)).not.toThrow();
  });

  it('throws when capacity is full', () => {
    expect(() => assertCapacityAvailable(10, 10)).toThrowError('Event capacity has already been reached.');
  });
});
