/**
 * Product north star — canonical voice for user-facing copy.
 * Full concept: docs/NORTHSTAR.md
 */

/** Primary elevator pitch. */
export const PRODUCT_TAGLINE =
  'The outdoors are better together — find your people in the UAE & GCC, make a plan, and go.';

/** Short emotional hook (hero, banners). */
export const PRODUCT_HOOK = "Don't get outside alone unless you want to.";

/** Who the product is for — one line. */
export const PRODUCT_AUDIENCE =
  'Residents, expats, tourists, and visitors — anyone here who wants company outdoors.';

/** Activity scope — examples, not limits. */
export const PRODUCT_ACTIVITY_SCOPE =
  'Hikes, camps, trail runs, jogs, and group outings that get you outside.';

/** Default SEO / Open Graph site description. */
export const PRODUCT_SITE_DESCRIPTION =
  'Find people to get outside with in the UAE & GCC — hikes, camps, runs, and group outings. Browse free, connect, and go together.';

/** Browse CTA label (aligned with explore nav). */
export const PRODUCT_EXPLORE_CTA = 'Explore the map';

/** Signed-in hub tab + mobile header title (`/plan`). */
export const PRODUCT_PLAN_SURFACE_TITLE = 'My Plans';

/** Sidebar / page context — outings you join and save (every member). */
export const PRODUCT_PLAN_MEMBER_NAV_HINT =
  'Outings you join, saved places, and goals — your side of getting outside together.';

/** Hosting hub — `/hosting` (not My Plans goals/wishlist). */
export const PRODUCT_HOSTING_SCHEDULE_NAV_LABEL = 'Hosting';

export const PRODUCT_HOSTING_SCHEDULE_NAV_HINT =
  'Upcoming outings you organize — approvals, chat, manage trips, and past history.';

/** Upcoming list context (Plan page). */
export const PRODUCT_PLAN_UPCOMING_JOINED_CONTEXT =
  'Plans you’re going on — RSVP’d or waiting for host approval.';

export const PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT =
  'Plans you’re organizing — published outings and open “find company” posts.';

/** Goals CRUD lives on Plan → Wishlist — not a standalone route. */
export const PRODUCT_PLAN_GOALS_ON_WISHLIST =
  'Set outdoor goals on your Wishlist tab — track progress next to saved plans.';

/** Explore people panel vs friends list (D11). */
export const PRODUCT_PEOPLE_DISCOVERY_LABEL = 'Find your crew';
/** Social hub tab — discover people to add as friends. */
export const PRODUCT_FIND_FRIENDS_HUB_LABEL = 'Find friends';
export const PRODUCT_FRIENDS_SURFACE_LABEL = 'Friends';
/** Friends + teams hub (desktop GO + hamburger; `/buddies` index). */
export const PRODUCT_MY_CREW_SURFACE_TITLE = 'My crew';
/** @deprecated Use {@link PRODUCT_MY_CREW_SURFACE_TITLE} — retained for import stability. */
export const PRODUCT_SOCIAL_SURFACE_TITLE = PRODUCT_MY_CREW_SURFACE_TITLE;
export const PRODUCT_SOCIAL_NAV_HINT =
  'Friends, family, or colleagues on a team — optional team chat for adults when you want to message.';
export const PRODUCT_GROUPS_SURFACE_LABEL = 'Teams';
export const PRODUCT_CREWS_TAB_LABEL = 'People';
export const PRODUCT_MY_CREW_CARD_TITLE = 'My crew';
export const PRODUCT_MY_CREW_CARD_SUBTITLE = 'Friends you message and teams you travel with';
export const PRODUCT_TEAM_CHAT_SUBTITLE = 'Optional team wall — adults only';
export const PRODUCT_TEAM_KID_ROSTER_NOTE = 'On trips only — not in team chat';
export const PRODUCT_TEAM_KID_READY_LABEL = 'Ready for outings';

/** Join CTA label — marketing / map browse (free account). */
export const PRODUCT_JOIN_CTA = 'Join free';

/** Activity join gates — account to RSVP, not “this outing is free”. */
export const GUEST_OUTING_SIGN_UP_CTA = 'Sign up to join';

/** Generic load failure — consumer hub sections. */
export const PRODUCT_LOAD_ERROR = "Couldn't load — try again.";

/** Retry action for failed loads. */
export const PRODUCT_RETRY_LABEL = 'Try again';

/** Auth screens */
export const PRODUCT_AUTH_SIGNUP_SUBLINE = 'Find your crew and get outside together — free to join.';

/** Signup profile wizard — finish signing up after auth. */
export const PRODUCT_SIGNUP_FINISH_TITLE = 'Finish signing up';
export const PRODUCT_SIGNUP_FINISH_SUBLINE = 'A few details so your crew and plans fit you.';
export const PRODUCT_SIGNUP_STEP_DOB = 'Date of Birth';
export const PRODUCT_SIGNUP_STEP_GENDER = 'Gender';
export const PRODUCT_SIGNUP_STEP_LOCATION = 'Where are you based?';
export const PRODUCT_SIGNUP_STEP_LANGUAGES = 'Languages you speak';
export const PRODUCT_SIGNUP_LOCATION_HINT = 'Country you live in or visit most for outdoor plans.';
export const PRODUCT_SIGNUP_LANGUAGES_HINT = 'Pick at least one — tap to add or remove.';
export const PRODUCT_EXPLORE_LOCATION_PROMPT_TITLE = 'Center the map on you?';
export const PRODUCT_EXPLORE_LOCATION_PROMPT_BODY =
  'See plans and people near you. You can change this anytime from the map.';
export const PRODUCT_AUTH_SIGNIN_SUBLINE = 'Pick up where you left off with your crew and plans.';

/** Profile — Up next empty */
export const PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE = 'No plans yet';
export const PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY =
  "See what's on near you, connect with a group, and go together.";

/** Activity hub — joined upcoming empty */
export const PRODUCT_JOINED_UPCOMING_EMPTY_TITLE = 'Nothing on your calendar yet';
export const PRODUCT_JOINED_UPCOMING_EMPTY_BODY =
  'Find an outing on the map — hikes, camps, runs, and group plans near you.';

/** Welcome / invite */
export const PRODUCT_WELCOME_HEADLINE = "You're in — find your crew.";
export const PRODUCT_INVITE_SHARE_TEXT =
  'Join me on UAE Trail — find people to get outside with in the UAE & GCC.';

/** Explore consumer blurbs */
export const PRODUCT_ACTIVITIES_EXPLORE_BLURB =
  'Outings you can join — hikes, camps, runs, and group plans posted by members and hosts.';

export const PRODUCT_EXPLORE_EMPTY_FILTERS =
  "Nothing here with these filters — try another type or area, or post what you're looking for.";
