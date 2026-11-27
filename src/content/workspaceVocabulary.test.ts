import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  inferParticipationModeFromRequirements,
} from '@uaetrail/shared-types';
import { workspaceConsoleLabel } from './workspaceVocabulary';

describe('workspaceVocabulary', () => {
  it('maps operator kinds to desk titles', () => {
    expect(workspaceConsoleLabel('host')).toBe('Hosting desk');
    expect(workspaceConsoleLabel('agency')).toBe('Agency desk');
    expect(workspaceConsoleLabel('shop')).toBe('Shop desk');
    expect(workspaceConsoleLabel('guide')).toBe('Guide desk');
    expect(workspaceConsoleLabel(null)).toBe('Operator desk');
  });

  it('approval requirement accepts Host canonical and Organizer legacy line', () => {
    expect(inferParticipationModeFromRequirements([APPROVAL_PARTICIPATION_REQUIREMENT])).toBe(
      'approval'
    );
    expect(
      inferParticipationModeFromRequirements(['Organizer approval required to join'])
    ).toBe('approval');
  });

  it('landing copy uses verified host (UPL) not verified organizer', () => {
    const marketing = readFileSync(join(process.cwd(), 'src/content/homeMarketing.ts'), 'utf8');
    expect(marketing).toMatch(/verified host/i);
    expect(marketing).not.toMatch(/verified organizer/i);
  });
});
