/** Warm consumer copy for explore compose wizards — crew-first, not host-console language. */

export const HOSTING_TYPE_SHEET_TITLE = 'What kind of plan?';

export const HOSTING_SEEKING_PREFILL_TITLE = 'Propose Plan';

export const HOSTING_PROFILE_INCOMPLETE_ERROR =
  'Finish your profile first — then you can publish this plan on the map.';

export const HOSTING_INTRO_PROMPT =
  'Finish your member profile (age, gender, and where you\u2019re based) to publish on the map.';

export const GOING_FROM_LABEL = 'Where are you going from?';

export const HOME_START_STEP_TITLE = 'Where do you start?';

export const HOME_START_HINT =
  'Where you live, or where you’ll start the drive — so people nearby can find this hike. We show the community and city. The place itself stays saved so others leaving from here can be matched.';

export const HOME_START_USE_LOCATION = 'Use my location';

export const HOME_START_AREA_NOTE = 'Shown as the community and city.';

export const HOME_START_PIN_OFFER = 'Pin the area if the name is off, or if you start from somewhere else.';

export const HOME_START_PIN_CTA = 'Pin a spot';

export const HOME_START_AREA_REQUIRED = 'Choose the area you start from.';

export const HOME_START_UNMATCHED = 'We couldn’t name that community and city. Try another spot.';

export const PICKUP_POINT_LABEL = 'Pickup point';

export const CAMP_LOCATION_LABEL = 'Camp location';

export const TO_LOCATION_LABEL = 'To location';

export const EXTRA_DIRECTIONS_LABEL = 'Extra directions';

export const HOSTING_CREW_CHAT_POLICY_TITLE = 'Crew chat messages';

export const JOIN_RULES_STEP_TITLE = 'Before they join';

export const PACKING_LIST_TITLE = 'What to bring';
export const PACKING_MODE_STRICT_TITLE = 'Strict';
export const PACKING_MODE_STRICT_SUBTITLE =
  'Joiners tick every must-have item and type their full name to confirm.';
export const PACKING_MODE_LENIENT_TITLE = 'Lenient';
export const PACKING_MODE_LENIENT_SUBTITLE = 'Joiners only see the list — no ticks or signature.';
export const PACKING_MUST_LABEL = 'Must have';
export const PACKING_NICE_LABEL = 'Optional';
export const PACKING_SIGNATURE_LABEL = 'Full name (digital signature)';
export const PACKING_SIGNATURE_HINT = 'Type your first and last name to confirm you will bring the must-have items.';
export const PACKING_DEFAULTS_CTA = 'Use typical hiking kit';

export const packingMustChipClass =
  'border border-amber-300 bg-amber-100 text-amber-950';
export const packingNiceChipClass = 'border border-sky-300 bg-sky-100 text-sky-950';
export const packingChipClassName = (required: boolean): string =>
  required ? packingMustChipClass : packingNiceChipClass;

export const JOIN_RULES_LABEL = 'Anything else they should know';

export const RIDE_RULES_LABEL = 'What riders should know *';

export const GOING_FROM_NOTES_PREVIEW_LABEL = 'Directions: ';

export const JOIN_RULES_PREVIEW_LABEL = 'Before joining: ';

export const RIDESHARE_PICKUP_HINT = 'Set the pickup point on the map.';

export const GOING_FROM_HINT = 'Drop a pin for where you\u2019re starting from.';

export const MEETING_FROM_VENUE_HINT =
  'People meet at the spot you chose. Edit it if the group meets somewhere else.';

export const MEETING_FROM_VENUE_EDIT = 'Edit';

export const MEETING_POINT_SEARCH = 'Search';

export const MEETING_POINT_PIN = 'Pin';

export const MEETING_POINT_EDIT_COORDS = 'Edit';

export const MEETING_POINT_SEARCH_HINT = 'Search for a place';

export const MEETING_POINT_PIN_HINT = 'Drop a pin on the map';

export const MEETING_POINT_EDIT_HINT = 'Type the coordinates';

export const MEETING_POINT_CHOOSE = 'Choose where people should meet.';

export const GOING_FROM_WITH_TIME_HINT = 'Set where you\u2019re starting from and an optional meet time.';

export const WHERE_STEP_CAMP_HINT = 'Choose where campers will meet or set up.';

export const WHERE_STEP_HINT = 'Choose where you\u2019ll start from.';

export const fromLocationLabel = (kind: 'rideshare' | 'default'): string =>
  kind === 'rideshare' ? PICKUP_POINT_LABEL : GOING_FROM_LABEL;

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

/** Host destination ladder: Area → Place hub → catalog leaf (trail / camp / venue). Facilities are Add on map, not here. */
export const HOSTING_DESTINATION_REGISTRY_LABEL = 'Select from catalog';

export const HOSTING_DESTINATION_SELECT_STATE = 'State';

export const HOSTING_DESTINATION_SELECT_AREA = 'Area';

export const HOSTING_DESTINATION_SELECT_PLACE = 'Place';

export const HOSTING_DESTINATION_SELECT_TRAIL = 'Trail';

export const HOSTING_DESTINATION_SELECT_TRAIL_CAMP = 'Camp spot';

export const HOSTING_DESTINATION_SELECT_TRAIL_EVENT = 'Venue name';

export const HOSTING_DESTINATION_SELECT_TRAIL_LABEL = 'Select trail';

export const HOSTING_DESTINATION_SELECT_TRAIL_CAMP_LABEL = 'Select camp spot';

export const HOSTING_DESTINATION_SELECT_TRAIL_EVENT_LABEL = 'Select venue';

export const HOSTING_DESTINATION_ADD_TRAIL_NEW = '+ New';

export const HOSTING_DESTINATION_FIND_PLACEHOLDER = 'e.g. Wadi Shawka, Hatta, Shawka loop';

export const HOSTING_DESTINATION_PICK_PLACE_FIRST =
  'Choose a place first — then add a new trail or camp spot under it.';

export const HOSTING_DESTINATION_LEAF_HINT =
  'One place can list several trails, camp spots, or routes — pick the one you’re leading.';

export const HOSTING_DESTINATION_RESET_LABEL = 'Clear selection';

export const HOSTING_DESTINATION_CUSTOM_NAME_TOGGLE = "Can't find it? Add under this place";

export const HOSTING_DESTINATION_CUSTOM_NAME_BACK = 'Back to catalog search';

export const HOSTING_DESTINATION_CUSTOM_REVIEW_NOTE =
  'Pin the spot and add a photo. If this is a new area, we submit the spot and the area together — both stay pending until an admin approves them.';

export const HOSTING_DESTINATION_CATALOG_LEAF_LINK_HIKING = 'Trail';
export const HOSTING_DESTINATION_CATALOG_LEAF_LINK_CAMPING = 'Camp spot';
export const HOSTING_DESTINATION_CATALOG_LEAF_LINK_EVENT = 'Venue';
export const HOSTING_DESTINATION_CATALOG_LEAF_VIEW = 'View on map';

/** @deprecated Use {@link HOSTING_DESTINATION_*} — legacy “venue” mixed hub and catalog leaf. */
export const HOSTING_VENUE_REGISTRY_LABEL = HOSTING_DESTINATION_REGISTRY_LABEL;
/** @deprecated */ export const HOSTING_VENUE_SELECT_STATE = HOSTING_DESTINATION_SELECT_STATE;
/** @deprecated */ export const HOSTING_VENUE_SELECT_AREA = HOSTING_DESTINATION_SELECT_AREA;
/** @deprecated */ export const HOSTING_VENUE_SELECT_PLACE = HOSTING_DESTINATION_SELECT_PLACE;
/** @deprecated */ export const HOSTING_VENUE_SELECT_TRAIL = HOSTING_DESTINATION_SELECT_TRAIL;
/** @deprecated */ export const HOSTING_VENUE_SELECT_TRAIL_CAMP = HOSTING_DESTINATION_SELECT_TRAIL_CAMP;
/** @deprecated */ export const HOSTING_VENUE_SELECT_TRAIL_EVENT = HOSTING_DESTINATION_SELECT_TRAIL_EVENT;
/** @deprecated */ export const HOSTING_VENUE_SELECT_TRAIL_LABEL = HOSTING_DESTINATION_SELECT_TRAIL_LABEL;
/** @deprecated */ export const HOSTING_VENUE_SELECT_TRAIL_CAMP_LABEL = HOSTING_DESTINATION_SELECT_TRAIL_CAMP_LABEL;
/** @deprecated */ export const HOSTING_VENUE_SELECT_TRAIL_EVENT_LABEL = HOSTING_DESTINATION_SELECT_TRAIL_EVENT_LABEL;
/** @deprecated */ export const HOSTING_VENUE_ADD_TRAIL_NEW = HOSTING_DESTINATION_ADD_TRAIL_NEW;
/** @deprecated */ export const HOSTING_VENUE_FIND_PLACEHOLDER = HOSTING_DESTINATION_FIND_PLACEHOLDER;
/** @deprecated */ export const HOSTING_VENUE_PICK_PLACE_FIRST = HOSTING_DESTINATION_PICK_PLACE_FIRST;
/** @deprecated */ export const HOSTING_VENUE_TRAIL_ROUTE_HINT = HOSTING_DESTINATION_LEAF_HINT;
/** @deprecated */ export const HOSTING_VENUE_RESET_LABEL = HOSTING_DESTINATION_RESET_LABEL;
/** @deprecated */ export const HOSTING_VENUE_CUSTOM_NAME_TOGGLE = HOSTING_DESTINATION_CUSTOM_NAME_TOGGLE;
/** @deprecated */ export const HOSTING_VENUE_CUSTOM_NAME_BACK = HOSTING_DESTINATION_CUSTOM_NAME_BACK;
/** @deprecated */ export const HOSTING_VENUE_CUSTOM_REVIEW_NOTE = HOSTING_DESTINATION_CUSTOM_REVIEW_NOTE;




export const HOSTING_PUBLISH_SUCCESS_TITLE = 'You\u2019re live';

export const HOSTING_PENDING_VENUE_TITLE = 'Submitted for review';

export const DEMAND_SUBMIT_SUCCESS_TITLE = 'Request posted';

export const DEMAND_SUBMIT_SUCCESS_BODY_ON_MAP =
  'You\u2019re on the map. Hosts and explorers nearby can message you or propose a matching plan.';

export const DEMAND_SUBMIT_SUCCESS_BODY_OFF_MAP =
  'We saved your request. Add a map pin next time to show on Explore \u2014 hosts can still reach you when you message or get matched.';

export const DEMAND_SUBMIT_VIEW_CTA = 'View';

export const ADD_SUBMIT_SUCCESS_TITLE = 'Submitted for review';

export const ADD_SUBMIT_SUCCESS_BODY_TRAIL =
  'Thanks for sharing this trail. We will review it and let you know when it is live on Explore for everyone.';

export const ADD_SUBMIT_SUCCESS_BODY_CAMP =
  'Thanks for sharing this camp spot. We will review it and let you know when it is live on Explore for everyone.';

export const ADD_SUBMIT_SUCCESS_BODY_FACILITY =
  'Thanks — we’ll review your facility pin and add it to the map once it’s approved.';

export const ADD_SUBMIT_SUCCESS_BODY_SHOP =
  'Thanks for sharing this shop. We will review it so others can find gear nearby on Explore.';

export const ADD_PENDING_NOTE_LOCATION = 'Pending review';

export const ADD_REVIEW_FOOTER_TRAIL =
  'Submit sends this trail for review. After submit, use View pending to see your preview.';

export const ADD_REVIEW_FOOTER_CAMP =
  'Submit sends this camp spot for review. After submit, use View pending to see your preview.';

export const ADD_REVIEW_FOOTER_SHOP =
  'Submit shares this shop as map info for the community. After submit, use View pending to preview your pin.';

export const ADD_PLACE_PENDING_BANNER_TITLE = 'Pending review';

export const ADD_PLACE_PENDING_BANNER_BODY =
  'Only you and admins can see this page until it is approved and published on Explore.';

export const ADD_SUBMIT_VIEW_CTA = 'View pending';

export const HOSTING_PUBLISH_SUCCESS_BODY_PRIVATE =
  'Share the link with your group. They’ll need to sign in to view and RSVP — this plan won’t show on the public map.';

export const HOSTING_RIDESHARE_PENDING_DESTINATION_BODY =
  'Your ride is saved. It goes live on the map when your destination place is approved — we’ll notify you.';

export const HOSTING_PENDING_VENUE_BODY =
  'This plan, the new spot, and the area are pending admin review. Nothing is live on the map or in search yet — we’ll notify you when they’re approved.';

export const HOSTING_PUBLISH_SUCCESS_BODY =
  'Your plan is published. Share it, view it on the map, or tap a ride below to attach it.';

export const HOSTING_RIDESHARE_SUCCESS_BODY =
  'Your ride is published. Share it, or tap an outing below to attach this ride.';

export const HOSTING_PUBLISH_VIEW_ON_MAP = 'View on map';

/** Post-publish success sheet — short primary CTA. */
export const HOSTING_PUBLISH_VIEW_CTA = 'View';

export const HOSTING_EDIT_SAVE_CTA = 'Save changes';

export const HOSTING_PUBLISH_SHARE_CTA = 'Share';

export const HOSTING_PUBLISH_CREATE_RIDE_CTA = 'Create a ride';

export const HOSTING_PUBLISH_LINK_OWN_RIDE_CTA = 'Link a ride you created';

export const HOSTING_LINK_RIDESHARE_LABEL = 'Link rideshare';

export const HOSTING_OFFER_RIDESHARE_LABEL = 'Offer rideshare';

export const HOSTING_LINK_RIDESHARE_CREATE = 'Create a rideshare';

export const HOSTING_LINK_RIDESHARE_PASTE_CTA = 'Paste rideshare link';

export const HOSTING_LINK_RIDESHARE_PASTE_LABEL = 'Or paste your rideshare link';

export const HOSTING_LINK_RIDESHARE_PASTE_PLACEHOLDER = 'https://uaetrail.com/activity/…';

export const HOSTING_LINK_RIDESHARE_HINT =
  'Tap a ride you already published to attach it here. Joiners will see it on this plan.';

export const HOSTING_LINK_RIDESHARE_PICK_LABEL = 'Your rides';

export const HOSTING_LINK_RIDESHARE_EMPTY =
  'No published rides yet. Paste a ride link below.';

export const HOSTING_RIDESHARE_LINKED_NOTICE = 'Rideshare linked — joiners will see it on your plan.';

export const HOSTING_LINK_PARENT_ACTIVITY_HINT =
  'Link this ride to a published hike, camp, or event you’ve joined or host.';

export const HOSTING_LINK_PARENT_EMPTY =
  'No published hikes, camps, or events you’ve joined or host yet. Paste an outing link instead.';

export const HOSTING_LINK_PARENT_PICK_LABEL = 'Your outings';

export const HOSTING_LINK_PARENT_PASTE_LABEL = 'Paste outing link';

export const HOSTING_LINK_PARENT_PASTE_PLACEHOLDER = 'https://uaetrail.com/activity/…';

export const HOSTING_LINK_PARENT_SUBMIT = 'Link to outing';

export const ACTIVITY_DETAIL_RIDESHARE_UNLINKED_GUEST =
  'This ride is not linked to a group outing yet.';

export const EXPLORE_LINKED_RIDESHARES_PEEK_TITLE = 'Rideshares for this plan';

export const EXPLORE_LINKED_PARENT_PLAN_PEEK_PREFIX = 'For plan:';

/** User-facing label — always “Rideshare”, not carpool. */
export const EXPLORE_RIDESHARE_AVAILABLE_LABEL = 'Rideshare available';


export const EXPLORE_VIEW_LINKED_PLAN_CTA = 'View outing';

/** Rideshare wizard — open the linked destination outing (not internal “peek” jargon). */
export const RIDESHARE_VIEW_DESTINATION_OUTING_CTA = 'View this outing';

export const EXPLORE_VIEW_LINKED_RIDESHARE_CTA = 'View rideshare';
