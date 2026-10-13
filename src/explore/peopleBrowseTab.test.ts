import { describe, expect, it } from 'vitest';
import {
  parsePeopleBrowseTab,
  parsePeopleBrowseTabFromUrl,
  serializePeopleBrowseTab,
} from './peopleBrowseTab';

describe('parsePeopleBrowseTab', () => {
  it('defaults to available', () => {
    expect(parsePeopleBrowseTab(null)).toBe('available');
  });

  it('accepts primary tabs', () => {
    expect(parsePeopleBrowseTab('available')).toBe('available');
    expect(parsePeopleBrowseTab('going')).toBe('going');
    expect(parsePeopleBrowseTab('connect')).toBe('connect');
  });

  it('maps legacy tab aliases', () => {
    expect(parsePeopleBrowseTab('all')).toBe('connect');
    expect(parsePeopleBrowseTab('friends')).toBe('going');
    expect(parsePeopleBrowseTab('followed')).toBe('going');
    expect(parsePeopleBrowseTab('discover')).toBe('available');
    expect(parsePeopleBrowseTab('looking')).toBe('available');
  });
});

describe('parsePeopleBrowseTabFromUrl', () => {
  it('defaults to available', () => {
    expect(parsePeopleBrowseTabFromUrl(null, null)).toBe('available');
  });

  it('prefers peopleTab over goingTab', () => {
    expect(parsePeopleBrowseTabFromUrl('connect', 'discover')).toBe('connect');
  });

  it('maps legacy goingTab when peopleTab absent', () => {
    expect(parsePeopleBrowseTabFromUrl(null, 'people')).toBe('going');
    expect(parsePeopleBrowseTabFromUrl(null, 'discover')).toBe('available');
    expect(parsePeopleBrowseTabFromUrl(null, 'trips')).toBe('connect');
  });
});

describe('serializePeopleBrowseTab', () => {
  it('omits default available', () => {
    expect(serializePeopleBrowseTab('available')).toBeNull();
    expect(serializePeopleBrowseTab('going')).toBe('going');
    expect(serializePeopleBrowseTab('connect')).toBe('connect');
  });
});
