import { describe, expect, it } from 'vitest';
import {
  parsePeopleBrowseTab,
  serializePeopleBrowseTab,
} from './peopleBrowseTab';
import {
  INBOUND_GOING_TAB_PARAM,
  PEOPLE_LIST_TAB_URL_PARAM,
  readPeopleCrewsTabParam,
} from '../routing/productUrlInbound';

describe('parsePeopleBrowseTab', () => {
  it('defaults to looking', () => {
    expect(parsePeopleBrowseTab(null)).toBe('looking');
  });

  it('accepts primary tabs', () => {
    expect(parsePeopleBrowseTab('looking')).toBe('looking');
    expect(parsePeopleBrowseTab('available')).toBe('available');
    expect(parsePeopleBrowseTab('going')).toBe('going');
    expect(parsePeopleBrowseTab('connect')).toBe('connect');
  });

  it('maps legacy tab aliases', () => {
    expect(parsePeopleBrowseTab('all')).toBe('connect');
    expect(parsePeopleBrowseTab('friends')).toBe('going');
    expect(parsePeopleBrowseTab('buddies')).toBe('hub');
    expect(parsePeopleBrowseTab('followed')).toBe('going');
    expect(parsePeopleBrowseTab('discover')).toBe('available');
  });
});

describe('people tab inbound choke', () => {
  const tabFromUrl = (peopleTab: string | null, inboundGoingTab: string | null) => {
    const params = new URLSearchParams();
    if (peopleTab) params.set(PEOPLE_LIST_TAB_URL_PARAM, peopleTab);
    else if (inboundGoingTab) params.set(INBOUND_GOING_TAB_PARAM, inboundGoingTab);
    return parsePeopleBrowseTab(readPeopleCrewsTabParam(params));
  };

  it('defaults to looking', () => {
    expect(tabFromUrl(null, null)).toBe('looking');
  });

  it('prefers peopleTab over goingTab', () => {
    expect(tabFromUrl('connect', 'discover')).toBe('connect');
  });

  it('maps legacy goingTab when peopleTab absent', () => {
    expect(tabFromUrl(null, 'people')).toBe('going');
    expect(tabFromUrl(null, 'discover')).toBe('available');
    expect(tabFromUrl(null, 'trips')).toBe('connect');
  });
});

describe('serializePeopleBrowseTab', () => {
  it('omits default looking', () => {
    expect(serializePeopleBrowseTab('looking')).toBeNull();
    expect(serializePeopleBrowseTab('available')).toBe('available');
    expect(serializePeopleBrowseTab('going')).toBe('going');
    expect(serializePeopleBrowseTab('connect')).toBe('connect');
  });
});
