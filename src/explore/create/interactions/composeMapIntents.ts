/**
 * Typed map-pick intents for the location kit.
 * New FAB / write surfaces add an id here — do not invent another overlay flag.
 */
export const COMPOSE_MAP_INTENTS = {
  addLocation: 'add.location',
  addParking: 'add.parking',
  addFacilityLocation: 'add.facility.location',
  seekArea: 'seek.area',
  seekFrom: 'seek.from',
  seekTo: 'seek.to',
  hostDestinationCatalog: 'host.destination.catalog',
  hostCustomSpot: 'host.custom.spot',
  hostGoingFrom: 'host.goingFrom',
  hostMeeting: 'host.meeting',
  hostRouteFrom: 'host.route.from',
  hostRouteTo: 'host.route.to',
  intentPrimary: 'intent.primary',
  intentTo: 'intent.to',
  proApplicationLocation: 'pro.application.location',
} as const;

export type ComposeMapIntent = (typeof COMPOSE_MAP_INTENTS)[keyof typeof COMPOSE_MAP_INTENTS];

export type PlacePickerMode = 'geocode' | 'catalog-search';
