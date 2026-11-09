import { describe, expect, it } from 'vitest';
import { formatActivityScrollDetailLeadDate } from './formatActivityScrollDetailLead';

describe('formatActivityScrollDetailLeadDate', () => {
  it('formats month, day, and schedule with time', () => {
    const lead = formatActivityScrollDetailLeadDate('2026-11-14', '06:00');
    expect(lead.label).toMatch(/Nov|Fri|Sat|Sun|Mon|Tue|Wed|Thu/i);
    expect(lead.month).toMatch(/Nov/i);
    expect(lead.day).toBe('14');
    expect(lead.time).toMatch(/6:00/);
    expect(lead.weekday).toMatch(/Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday/);
  });

  it('omits time when missing', () => {
    const lead = formatActivityScrollDetailLeadDate('2026-11-14', null);
    expect(lead.time).toBeNull();
  });
});
