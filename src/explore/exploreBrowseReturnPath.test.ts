import { describe, expect, it } from 'vitest';
import { exploreMapPathAfterPeopleFullScreen } from './exploreBrowseReturnPath';

describe('exploreMapPathAfterPeopleFullScreen', () => {
  it('closes mobile list sheet and people view params', () => {
    expect(
      exploreMapPathAfterPeopleFullScreen('/explore?list=1&view=people&peopleTab=available&buddies=available')
    ).toBe('/explore?list=0');
  });

  it('closes discover browse overlay', () => {
    expect(exploreMapPathAfterPeopleFullScreen('/explore?browse=1&q=hatta')).toBe('/explore?q=hatta&list=0');
  });
});
