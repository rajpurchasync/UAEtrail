import { describe, expect, it } from 'vitest';
import { memberHomeFirstName, memberHomeGreeting, memberHomeKindChip } from './memberHomeCopy';

describe('memberHomeCopy', () => {
  it('greets with first name and time of day', () => {
    expect(memberHomeGreeting(8, 'Sarah')).toBe('Good Morning, Sarah');
    expect(memberHomeGreeting(14, 'Omar')).toBe('Good Afternoon, Omar');
    expect(memberHomeGreeting(20, 'Noor')).toBe('Good Evening, Noor');
    expect(memberHomeGreeting(9, null)).toBe('Good Morning');
  });

  it('uses the first token of display name', () => {
    expect(memberHomeFirstName('Sarah Ahmed')).toBe('Sarah');
    expect(memberHomeFirstName('  ')).toBeNull();
  });

  it('maps outing kinds to chips', () => {
    expect(memberHomeKindChip('hiking')).toBe('Day hike');
    expect(memberHomeKindChip('camping')).toBe('Camping');
  });
});
