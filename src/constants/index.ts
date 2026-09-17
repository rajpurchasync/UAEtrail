import { ADMIN_PLACES_PATH, HOST_PLACES_PATH } from '../config/platform';

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

/** Public activities browse + dashboard tab. */
export const ACTIVITIES_PATH = '/activities';

/** Host publishing console nav — tools live under /host routes. */
export const HOST_CONSOLE_LINKS = [
  { to: '/host/overview', label: 'Overview' },
  { to: '/host/profile', label: 'Public profile' },
  { to: '/host/activities', label: 'Activities' },
  { to: '/host/requests', label: 'Join requests' },
  { to: '/host/team', label: 'Team' },
  { to: HOST_PLACES_PATH, label: 'Places' },
  { to: '/host/messages', label: 'Messages' },
  { to: '/host/history', label: 'History' },
  { to: '/my-rewards', label: 'Trail Points' },
];

/** @deprecated Use HOST_CONSOLE_LINKS */
export const ORGANISATION_CONSOLE_LINKS = HOST_CONSOLE_LINKS;

/** @deprecated Use HOST_CONSOLE_LINKS */
export const HOST_DASHBOARD_LINKS = HOST_CONSOLE_LINKS;

export const ADMIN_LINKS = [
  { to: '/admin/overview', label: 'Overview' },
  { to: ADMIN_PLACES_PATH, label: 'Places' },
  { to: '/admin/users', label: 'Members' },
  { to: '/admin/hosts', label: 'Hosts' },
  { to: '/admin/activities', label: 'Activities' },
  { to: '/admin/groups', label: 'Groups' },
  { to: '/admin/shop', label: 'Shop' },
  { to: '/admin/audit-log', label: 'Audit Log' },
  { to: '/admin/settings', label: 'Broadcast' }
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
