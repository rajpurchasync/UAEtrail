/** Warm consumer copy for explore compose wizards — crew-first, not host-console language. */

export const ORGANIZE_TYPE_SHEET_TITLE = 'What kind of plan?';

export const ORGANIZE_DEMAND_PREFILL_TITLE = 'Set up this plan';

export const ORGANIZE_HOST_PROFILE_ERROR =
  'Almost there — tell people a bit about you first so you can share this plan.';

export const ORGANIZE_INTRO_PROMPT =
  'Almost there — a quick intro so people know who they\u2019re meeting up with. We\u2019ll walk you through it.';

export const GOING_FROM_LABEL = 'Going from';

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
