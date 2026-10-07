import {
  ADMIN_ACTIVITIES_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_GROUPS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_SHOP_PATH,
  ADMIN_USERS_PATH,
} from '../config/adminSurfacePaths';
import {
  ADMIN_PLACES_PATH,
  HOST_ACTIVITIES_PATH,
  HOST_HISTORY_PATH,
  HOST_MESSAGES_PATH,
  HOST_OVERVIEW_PATH,
  HOST_PLACES_PATH,
  HOST_PROFILE_PATH,
  HOST_REQUESTS_PATH,
  HOST_TEAM_PATH,
  TRIPS_PATH,
} from '../config/surfacePaths';

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

/** Public activities browse + dashboard tab. */
export { TRIPS_PATH };
/** @deprecated Use {@link TRIPS_PATH} */
export const ACTIVITIES_PATH = TRIPS_PATH;

/** Host publishing console nav — tools live under /host routes. */
export const HOST_CONSOLE_LINKS = [
  { to: HOST_OVERVIEW_PATH, label: 'Overview' },
  { to: HOST_PROFILE_PATH, label: 'Public profile' },
  { to: HOST_ACTIVITIES_PATH, label: 'Activities' },
  { to: HOST_REQUESTS_PATH, label: 'Join requests' },
  { to: HOST_TEAM_PATH, label: 'Team' },
  { to: HOST_PLACES_PATH, label: 'Places' },
  { to: HOST_MESSAGES_PATH, label: 'Messages' },
  { to: HOST_HISTORY_PATH, label: 'History' },
];

/** @deprecated Use HOST_CONSOLE_LINKS */
export const ORGANISATION_CONSOLE_LINKS = HOST_CONSOLE_LINKS;

/** @deprecated Use HOST_CONSOLE_LINKS */
export const HOST_DASHBOARD_LINKS = HOST_CONSOLE_LINKS;

export const ADMIN_LINKS = [
  { to: ADMIN_OVERVIEW_PATH, label: 'Overview' },
  { to: ADMIN_PLACES_PATH, label: 'Places' },
  { to: ADMIN_USERS_PATH, label: 'Users' },
  { to: ADMIN_HOSTS_PATH, label: 'Hosts' },
  { to: ADMIN_ACTIVITIES_PATH, label: 'Activities' },
  { to: ADMIN_GROUPS_PATH, label: 'Groups' },
  { to: ADMIN_SHOP_PATH, label: 'Shop' },
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
