import { describe, expect, it } from 'vitest';
import {
  parseExplorePeopleBrowseTab,
  parsePeopleListBrowseTab,
  serializePeopleListBrowseTab,
} from './peopleListBrowseUrl';

describe('peopleListBrowseUrl', () => {
  it('parses URL segment with hub default on crews list', () => {
    expect(parsePeopleListBrowseTab(null)).toBe('hub');
    expect(parsePeopleListBrowseTab('available')).toBe('available');
    expect(parsePeopleListBrowseTab('going')).toBe('going');
    expect(parsePeopleListBrowseTab('connect')).toBe('connect');
  });

  it('maps legacy inbound values (not buddies= segment name)', () => {
    expect(parsePeopleListBrowseTab('friends')).toBe('going');
    expect(parsePeopleListBrowseTab('buddies')).toBe('hub');
    expect(parsePeopleListBrowseTab('all')).toBe('connect');
    expect(parsePeopleListBrowseTab('looking')).toBe('looking');
    expect(parsePeopleListBrowseTab('followed')).toBe('going');
  });

  it('parseExplorePeopleBrowseTab reads peopleTab, buddies, socialTab, goingTab', () => {
    expect(parseExplorePeopleBrowseTab(new URLSearchParams('view=people'))).toBe('looking');
    expect(
      parseExplorePeopleBrowseTab(new URLSearchParams('view=people&peopleTab=available'))
    ).toBe('available');
    expect(
      parseExplorePeopleBrowseTab(new URLSearchParams('view=people&buddies=going'))
    ).toBe('going');
    expect(
      parseExplorePeopleBrowseTab(new URLSearchParams('view=people&socialTab=connect'))
    ).toBe('connect');
    expect(parseExplorePeopleBrowseTab(new URLSearchParams('view=people&goingTab=discover'))).toBe(
      'available'
    );
  });

  it('serializes non-default segments to peopleTab', () => {
    expect(serializePeopleListBrowseTab('hub')).toBeNull();
    expect(serializePeopleListBrowseTab('looking')).toBeNull();
    expect(serializePeopleListBrowseTab('available')).toBe('available');
    expect(serializePeopleListBrowseTab('going')).toBe('going');
    expect(serializePeopleListBrowseTab('connect')).toBe('connect');
  });
});