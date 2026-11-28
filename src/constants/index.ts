import {
  JOURNEY_MAP_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
} from '../config/surfacePaths';
import { ADMIN_SIDEBAR_LINKS } from '../admin/adminNav';

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

export { PLAN_PATH, PROFILE_HISTORY_PATH, JOURNEY_MAP_PATH };

/** Flat admin sidebar links (grouped IA lives in `adminNav.ts`). */
export const ADMIN_LINKS = ADMIN_SIDEBAR_LINKS;

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
