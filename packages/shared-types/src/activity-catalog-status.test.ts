import { describe, expect, it } from 'vitest';
import {
  activityCatalogAllows,
  activityCatalogDenialMessage,
  isDraftActivityStatus,
  isPublishedActivityStatus,
  isSuspendedActivityStatus,
  resolveActivityCatalogRemoveKind,
} from './activity-catalog-status.js';

describe('activity catalog status machine', () => {
  it('allows publish only from draft (Mongo SCREAMING included)', () => {
    expect(activityCatalogAllows('draft', 'publish')).toBe(true);
    expect(activityCatalogAllows('DRAFT', 'publish')).toBe(true);
    expect(activityCatalogAllows('published', 'publish')).toBe(false);
    expect(activityCatalogAllows('suspended', 'publish')).toBe(false);
  });

  it('allows edit on draft and published, not suspended or cancelled', () => {
    expect(activityCatalogAllows('draft', 'edit')).toBe(true);
    expect(activityCatalogAllows('published', 'edit')).toBe(true);
    expect(activityCatalogAllows('suspended', 'edit')).toBe(false);
    expect(activityCatalogAllows('cancelled', 'edit')).toBe(false);
  });

  it('suspends only published and resumes only suspended', () => {
    expect(activityCatalogAllows('published', 'suspend')).toBe(true);
    expect(activityCatalogAllows('PUBLISHED', 'suspend')).toBe(true);
    expect(activityCatalogAllows('draft', 'suspend')).toBe(false);
    expect(activityCatalogAllows('suspended', 'resume')).toBe(true);
    expect(activityCatalogAllows('published', 'resume')).toBe(false);
  });

  it('routes remove to draft delete vs cancel', () => {
    expect(resolveActivityCatalogRemoveKind('draft')).toBe('delete_draft');
    expect(resolveActivityCatalogRemoveKind('published')).toBe('cancel');
    expect(resolveActivityCatalogRemoveKind('suspended')).toBe('cancel');
    expect(resolveActivityCatalogRemoveKind('cancelled')).toBeNull();
    expect(activityCatalogAllows('cancelled', 'remove')).toBe(false);
  });

  it('keeps API denial copy stable', () => {
    expect(activityCatalogDenialMessage('publish')).toBe('Only draft activities can be published.');
    expect(activityCatalogDenialMessage('suspend')).toBe(
      'Only published activities can be suspended.'
    );
    expect(activityCatalogDenialMessage('resume')).toBe(
      'Only suspended activities can be resumed.'
    );
    expect(activityCatalogDenialMessage('delete_draft')).toBe(
      'Only draft activities can be deleted.'
    );
    expect(activityCatalogDenialMessage('edit', 'SUSPENDED')).toBe(
      'Cannot edit an activity that is suspended.'
    );
  });

  it('normalizes published / draft / suspended checks', () => {
    expect(isPublishedActivityStatus('PUBLISHED')).toBe(true);
    expect(isDraftActivityStatus('draft')).toBe(true);
    expect(isSuspendedActivityStatus('suspended')).toBe(true);
    expect(isPublishedActivityStatus('draft')).toBe(false);
  });
});
