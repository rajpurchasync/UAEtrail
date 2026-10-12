import { describe, expect, it } from 'vitest';
import { parseOrganisationPublicDetailTabParam } from './organisationPublicDetailTab';

describe('parseOrganisationPublicDetailTabParam', () => {
  it('defaults to about', () => {
    expect(parseOrganisationPublicDetailTabParam(undefined)).toBe('about');
  });

  it('parses outings and contact', () => {
    expect(parseOrganisationPublicDetailTabParam('outings')).toBe('outings');
    expect(parseOrganisationPublicDetailTabParam('contact')).toBe('contact');
  });
});
