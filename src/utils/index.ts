import { formatExploreEventDateLabel } from '@uaetrail/shared-types';
import { DifficultyLevel } from '../types';
import { DIFFICULTY_COLORS } from '../constants';

export const formatDate = (dateString: string): string =>
  formatExploreEventDateLabel(dateString) ?? dateString;

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  return DIFFICULTY_COLORS[difficulty];
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
