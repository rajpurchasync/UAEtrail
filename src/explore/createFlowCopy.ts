/** Warm consumer copy for explore compose wizards — crew-first, not host-console language. */

export const ORGANIZE_TYPE_SHEET_TITLE = 'What kind of plan?';

export const ORGANIZE_DEMAND_PREFILL_TITLE = 'Propose Plan';

export const ORGANIZE_HOST_PROFILE_ERROR =
  'Almost there — tell people a bit about you first so you can share this plan.';

export const ORGANIZE_INTRO_PROMPT =
  'Almost there — a quick intro so people know who they\u2019re meeting up with. We\u2019ll walk you through it.';

export const GOING_FROM_LABEL = 'Where are you going from?';

export const PICKUP_POINT_LABEL = 'Pickup point';

export const CAMP_LOCATION_LABEL = 'Camp location';

export const TO_LOCATION_LABEL = 'To location';

export const EXTRA_DIRECTIONS_LABEL = 'Extra directions';

export const JOIN_RULES_STEP_TITLE = 'Before they join';

export const JOIN_RULES_LABEL = 'What to know before joining *';

export const RIDE_RULES_LABEL = 'What riders should know *';

export const GOING_FROM_NOTES_PREVIEW_LABEL = 'Directions: ';

export const JOIN_RULES_PREVIEW_LABEL = 'Before joining: ';

export const CARPOOL_PICKUP_HINT = 'Set the pickup point on the map.';

export const GOING_FROM_HINT = 'Drop a pin for where you\u2019re starting from.';

export const GOING_FROM_WITH_TIME_HINT = 'Set where you\u2019re starting from and an optional meet time.';

export const WHERE_STEP_CAMP_HINT = 'Choose where campers will meet or set up.';

export const WHERE_STEP_HINT = 'Choose where you\u2019ll start from.';

export const fromLocationLabel = (kind: 'carpool' | 'default'): string =>
  kind === 'carpool' ? PICKUP_POINT_LABEL : GOING_FROM_LABEL;

export const HIKE_PUBLIC_EVENT_LABEL = 'Public';

export const HIKE_PUBLIC_EVENT_SUBTITLE = 'Will be available for public to view on map';

export const HIKE_PRIVATE_EVENT_LABEL = 'Private';

export const HIKE_PRIVATE_EVENT_SUBTITLE = 'Invite only — by sharing link';

export const HIKE_APPROVAL_QUESTION = 'Do people need approval to join?';

export const HIKE_APPROVAL_YES_LABEL = 'Yes — I need to approve';

export const HIKE_APPROVAL_YES_SUBTITLE = 'They request — you OK each person';

export const HIKE_APPROVAL_NO_LABEL = 'No — they can just come';

export const HIKE_APPROVAL_NO_SUBTITLE = 'People can join but approval not needed.';

export const HIKE_PRIVATE_EVENT_INFO =
  'Private events are shared by link only. People still need to confirm by clicking "I will join". You will be notified but do not need to approve.';

export const PARTICIPANTS_SPOTS_QUESTION = 'How many spots available?';

export const PARTICIPANTS_ANYONE_TITLE = 'Anyone';

export const PARTICIPANTS_ANYONE_SUBTITLE = 'Open to all';

export const PARTICIPANTS_LIMITED_TITLE = 'Limited';

export const PARTICIPANTS_LIMITED_SUBTITLE = 'Restrictions apply';

export const PARTICIPANTS_WHO_CAN_JOIN = 'Who can join?';

export const PARTICIPANTS_MIN_AGE_LABEL = 'Minimum age';

export const ORGANIZE_VENUE_REGISTRY_LABEL = 'Select venue';

export const ORGANIZE_VENUE_CUSTOM_NAME_TOGGLE = "Can't find it? Enter the venue name";

export const ORGANIZE_VENUE_CUSTOM_NAME_BACK = 'Search the registry again';

/** @deprecated Use ORGANIZE_VENUE_REGISTRY_LABEL */
export const ORGANIZE_DESTINATION_CATALOG_LABEL = ORGANIZE_VENUE_REGISTRY_LABEL;

/** @deprecated Use ORGANIZE_VENUE_CUSTOM_NAME_TOGGLE */
export const ORGANIZE_DESTINATION_MANUAL_TOGGLE = ORGANIZE_VENUE_CUSTOM_NAME_TOGGLE;

/** @deprecated Use ORGANIZE_VENUE_CUSTOM_NAME_BACK */
export const ORGANIZE_DESTINATION_MANUAL_BACK = ORGANIZE_VENUE_CUSTOM_NAME_BACK;

export const ORGANIZE_PUBLISH_SUCCESS_TITLE = 'You\u2019re live';

export const ORGANIZE_PUBLISH_SUCCESS_BODY =
  'Your plan is published. You can offer carpool below, then take people to the map pin.';

export const ORGANIZE_PUBLISH_VIEW_ON_MAP = 'View on map';

export const ORGANIZE_LINK_CARPOOL_LABEL = 'Link carpool';

export const ORGANIZE_LINK_CARPOOL_HINT =
  'Optional — let joiners know shared rides are available. You can coordinate in chat.';

export const ORGANIZE_CARPOOL_LINKED_NOTICE = 'Carpool linked — joiners will see it on your plan.';
