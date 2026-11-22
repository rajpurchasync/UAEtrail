import { describe, expect, it } from 'vitest';
import { createFlowPath } from './createFlowPath';

const hostMenu = { surface: 'menu' as const, composeKind: 'activity' as const };

describe('createFlowPath', () => {
  it('keeps create session on Plan, list, and explore', () => {
    expect(createFlowPath('/plan', '', hostMenu)).toContain('/plan');
    expect(createFlowPath('/plan', '', hostMenu)).toContain('compose=activity');
    expect(createFlowPath('/list', '?listCat=activities', hostMenu)).toContain('/list');
    expect(createFlowPath('/explore', '?panel=venues', hostMenu)).toContain('/explore');
  });

  it('does not send marketing or admin to a create overlay on those routes', () => {
    expect(createFlowPath('/', '', hostMenu)).toMatch(/^\/explore/);
    expect(createFlowPath('/admin/overview', '', hostMenu)).toMatch(/^\/explore/);
  });
});
