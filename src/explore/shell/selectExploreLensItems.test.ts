import { describe, expect, it } from 'vitest';
import { hostedExploreMapItem, venueExploreMapItem } from '../exploreMapItemFixtures';
import { selectExploreLensItems } from './selectExploreLensItems';

describe('selectExploreLensItems', () => {
  it('desktop venues tab uses places-discovery selector', () => {
    const venue = venueExploreMapItem({ id: 'venue:v1' });
    const activity = hostedExploreMapItem({ id: 'activity:a1' });
    const pool = selectExploreLensItems({
      catalog: [venue, activity],
      isDesktop: true,
      desktopBrowseTab: 'venues',
      sidebarPanel: 'activities',
      mapFilter: 'all',
      venueFilter: 'all',
      tripMapTopics: [],
      placeMapTopics: [],
      venueRegions: [],
      activityDatePreset: 'anyday',
      buddySubtype: 'all',
      outingTopic: 'all',
      activityModeFilter: 'all',
    });
    expect(pool.map((i) => i.id)).toEqual(['venue:v1']);
  });

  it('mobile activities panel uses activity-discovery selector', () => {
    const venue = venueExploreMapItem({ id: 'venue:v1' });
    const activity = hostedExploreMapItem({ id: 'activity:a1' });
    const pool = selectExploreLensItems({
      catalog: [venue, activity],
      isDesktop: false,
      desktopBrowseTab: 'activities',
      sidebarPanel: 'activities',
      mapFilter: 'all',
      venueFilter: 'all',
      tripMapTopics: [],
      placeMapTopics: [],
      venueRegions: [],
      activityDatePreset: 'anyday',
      buddySubtype: 'all',
      outingTopic: 'all',
      activityModeFilter: 'all',
    });
    expect(pool.map((i) => i.id)).toEqual(['activity:a1']);
  });
});