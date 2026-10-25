import { describe, expect, it } from 'vitest';
import { linkedParentRidesharePeekCopy } from './exploreLinkedParentRideshareCopy';

describe('linkedParentRidesharePeekCopy', () => {
  it('uses trip/plan subtitles for hiking and camping', () => {
    expect(linkedParentRidesharePeekCopy('hiking', 'Sunrise at Jebel')).toEqual({
      eyebrow: 'Linked to Hiking Trip',
      showTitleSubtitle: true,
    });
    expect(linkedParentRidesharePeekCopy('camping', 'Desert night')).toEqual({
      eyebrow: 'Linked to Camping Plan',
      showTitleSubtitle: true,
    });
  });

  it('uses event subtitle when parent is an event', () => {
    expect(linkedParentRidesharePeekCopy('event', 'Beach cleanup')).toEqual({
      eyebrow: 'Linked to Event',
      showTitleSubtitle: true,
    });
    expect(linkedParentRidesharePeekCopy('guide', 'Group outing')).toEqual({
      eyebrow: 'Linked to Group outing',
      showTitleSubtitle: false,
    });
  });
});
