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

/** Desktop organizer dashboard sidebar — Team is separate from public profile. */
export const ORGANIZER_DASHBOARD_LINKS = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/profile', label: 'Public Profile' },
  { to: '/organizer/events', label: 'Activities' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Venues' },
  { to: '/organizer/messages', label: 'Messages' },
  { to: '/organizer/history', label: 'History' },
  { to: '/my-rewards', label: 'Trail Points' },
];

export const ADMIN_LINKS = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'User Management' },
  { to: '/admin/organizers', label: 'Organizers' },
  { to: '/admin/events', label: 'Activities' },
  { to: '/admin/groups', label: 'Groups' },
  { to: '/admin/shop', label: 'Shop' },
  { to: '/admin/audit-log', label: 'Audit Log' },
  { to: '/admin/settings', label: 'Broadcast' }
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
