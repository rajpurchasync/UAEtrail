import { describe, expect, it } from 'vitest';
import { formatActivityDetailConsumerLeadDate } from './formatActivityDetailConsumerLead';

describe('formatActivityDetailConsumerLeadDate', () => {
  it('formats month, day, and schedule with time', () => {
    const lead = formatActivityDetailConsumerLeadDate('2026-11-14', '06:00');
    expect(lead.month).toMatch(/Nov/i);
    expect(lead.day).toBe('14');
    expect(lead.time).toMatch(/6:00/);
    expect(lead.weekday).toMatch(/Fri|Sat|Sun|Mon|Tue|Wed|Thu/i);
  });

  it('omits time when missing', () => {
    const lead = formatActivityDetailConsumerLeadDate('2026-11-14', null);
    expect(lead.time).toBeNull();
  });
});
