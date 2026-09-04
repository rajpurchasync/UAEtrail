import { UAERegion } from '../types';
import { getRegionsForCountry, DEFAULT_COUNTRY } from '../config/regions';

/** @deprecated Use getRegionsForCountry() for GCC support */
export const UAE_REGIONS: UAERegion[] = getRegionsForCountry(DEFAULT_COUNTRY) as UAERegion[];

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

export const STATUS_COLORS = {
  free: 'bg-green-500',
  paid: 'bg-blue-500',
  full: 'bg-gray-400'
};

/** Public activities browse + dashboard tab. */
export const ACTIVITIES_PATH = '/activities';
export const ADMIN_ACTIVITIES_PATH = '/admin/activities';

export const activityDetailPath = (activityId: string) => `/activity/${activityId}`;

/** @deprecated Use activityDetailPath */
export const tripDetailPath = activityDetailPath;

/** Host console nav — hosting tools live under /host, not on the public activities page. */
export const HOST_DASHBOARD_LINKS = [
  { to: '/host/overview', label: 'Overview' },
  { to: '/host/profile', label: 'Public Profile' },
  { to: '/host/activities', label: 'Activities' },
  { to: '/host/requests', label: 'Join Requests' },
  { to: '/host/team', label: 'Team' },
  { to: '/host/locations', label: 'Venues' },
  { to: '/host/messages', label: 'Messages' },
  { to: '/host/history', label: 'History' },
  { to: '/my-rewards', label: 'Trail Points' },
];

/** @deprecated Use HOST_DASHBOARD_LINKS */
export const ORGANIZER_DASHBOARD_LINKS = HOST_DASHBOARD_LINKS;

export const ADMIN_LINKS = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'User Management' },
  { to: '/admin/hosts', label: 'Hosts' },
  { to: ADMIN_ACTIVITIES_PATH, label: 'Activities' },
  { to: '/admin/groups', label: 'Groups' },
  { to: '/admin/shop', label: 'Shop' },
  { to: '/admin/audit-log', label: 'Audit Log' },
  { to: '/admin/settings', label: 'Broadcast' }
];

export const MERCHANT_DASHBOARD_LINKS = [
  { to: '/merchant/dashboard', label: 'Dashboard' },
  { to: '/shop', label: 'Public Shop' },
];

export const HIKING_SUBCATEGORIES = [
  'Shoes',
  'Backpacks',
  'Clothing',
  'Accessories'
];

export const CAMPING_SUBCATEGORIES = [
  'Tents',
  'Chairs',
  'BBQ',
  'Accessories'
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
