import {
  ADMIN_ACTIVITIES_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_GROUPS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_AREAS_PATH,
  ADMIN_FACILITIES_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_USERS_PATH,
} from '../config/adminSurfacePaths';
import {
  ADMIN_PLACES_PATH,
  PUBLISHING_ACTIVITIES_PATH,
  PUBLISHING_HISTORY_PATH,
  PUBLISHING_OVERVIEW_PATH,
  PUBLISHING_PLACES_PATH,
  PUBLISHING_PROFILE_PATH,
  PUBLISHING_REQUESTS_PATH,
  PUBLISHING_TEAM_PATH,
  JOURNEY_MAP_PATH,
  MY_TRIPS_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  TRIPS_PATH,
} from '../config/surfacePaths';

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

/** Active Plan tab + legacy trip hub aliases. */
export { PLAN_PATH, PROFILE_HISTORY_PATH, JOURNEY_MAP_PATH, MY_TRIPS_PATH, TRIPS_PATH };
/** @deprecated Personal hub bookmark — redirects to {@link PLAN_PATH} or {@link PROFILE_HISTORY_PATH}. */
export const ACTIVITIES_PATH = '/activities' as const;

/** Publishing console nav — canonical `/publishing/*` routes. */
export const PUBLISHING_CONSOLE_LINKS = [
  { to: PUBLISHING_OVERVIEW_PATH, label: 'Overview' },
  { to: PUBLISHING_PROFILE_PATH, label: 'Public profile' },
  { to: PUBLISHING_ACTIVITIES_PATH, label: 'Activities' },
  { to: PUBLISHING_REQUESTS_PATH, label: 'Join requests' },
  { to: PUBLISHING_TEAM_PATH, label: 'Team' },
  { to: PUBLISHING_PLACES_PATH, label: 'Places' },
  { to: PUBLISHING_HISTORY_PATH, label: 'History' },
];




export const ADMIN_LINKS = [
  { to: ADMIN_OVERVIEW_PATH, label: 'Overview' },
  { to: ADMIN_AREAS_PATH, label: 'Areas' },
  { to: ADMIN_PLACES_PATH, label: 'Places' },
  { to: ADMIN_ACTIVITIES_PATH, label: 'Activities' },
  { to: ADMIN_FACILITIES_PATH, label: 'Facilities' },
  { to: ADMIN_USERS_PATH, label: 'Users & Members' },
  { to: ADMIN_HOSTS_PATH, label: 'Operators' },
  { to: ADMIN_GROUPS_PATH, label: 'Groups' },
  { to: ADMIN_REPORTS_PATH, label: 'Reports' },
  { to: ADMIN_AUDIT_LOG_PATH, label: 'Audit Log' },
  { to: ADMIN_SETTINGS_PATH, label: 'Broadcast' },
];

export const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahrain','Bangladesh','Belarus','Belgium','Bhutan','Bolivia','Bosnia and Herzegovina','Brazil','Brunei','Bulgaria',
  'Cambodia','Cameroon','Canada','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji','Finland','France',
  'Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia',
  'Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Maldives','Malta','Mexico','Moldova','Monaco','Mongolia',
  'Montenegro','Morocco','Mozambique','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia',
  'Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia',
  'South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Tunisia','Turkey','Turkmenistan','UAE','Uganda','Ukraine','United Kingdom','United States',
  'Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];
