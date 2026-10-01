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

  it('embeds event title in eyebrow', () => {
    expect(linkedParentRidesharePeekCopy('event', 'Beach cleanup')).toEqual({
      eyebrow: 'Linked to Beach cleanup',
      showTitleSubtitle: false,
    });
    expect(linkedParentRidesharePeekCopy('guide', 'Group outing')).toEqual({
      eyebrow: 'Linked to Group outing',
      showTitleSubtitle: false,
    });
  });
});
