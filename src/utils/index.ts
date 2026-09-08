import { DifficultyLevel } from '../types';
import { DIFFICULTY_COLORS } from '../constants';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  return DIFFICULTY_COLORS[difficulty];
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
