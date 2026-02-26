import { DifficultyLevel } from '../types';
import { DIFFICULTY_COLORS } from '../constants';

export const formatPrice = (price: number): string => {
  if (price === 0) return 'Free';
  return `AED ${price.toLocaleString()}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (timeString: string): string => {
  return timeString;
};

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  return DIFFICULTY_COLORS[difficulty];
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
