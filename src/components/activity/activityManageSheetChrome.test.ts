import { describe, expect, it } from 'vitest';
import {
  activityManageSheetChromeClosed,
  activityManageSheetChromeIsCoherent,
  activityManageSheetCloseOptions,
  activityManageSheetHeaderBack,
  activityManageSheetOpenEdit,
  activityManageSheetOpenOptions,
  activityManageSheetSelectSubview,
  activityManageSheetSelectSubviewFromMenu,
} from './activityManageSheetChrome';

describe('activityManageSheetChrome', () => {
  it('options menu only pairs with overview', () => {
    const options = activityManageSheetOpenOptions(activityManageSheetChromeClosed());
    expect(options.view).toBe('overview');
    expect(activityManageSheetChromeIsCoherent(options)).toBe(true);

    const bad = { ...options, view: 'invite' as const };
    expect(activityManageSheetChromeIsCoherent(bad)).toBe(false);
  });

  it('subview opened from overview does not reopen options on back', () => {
    const sub = activityManageSheetSelectSubview('invite', false);
    const back = activityManageSheetHeaderBack(sub);
    expect(back).not.toBe('close');
    if (back === 'close') throw new Error('expected chrome');
    expect(back.view).toBe('overview');
    expect(back.optionsOpen).toBe(false);
  });

  it('subview from menu backs into options', () => {
    const sub = activityManageSheetSelectSubviewFromMenu('invite');
    const back = activityManageSheetHeaderBack(sub);
    expect(back).not.toBe('close');
    if (back === 'close') throw new Error('expected chrome');
    expect(back.optionsOpen).toBe(true);
    expect(activityManageSheetChromeIsCoherent(back)).toBe(true);
  });

  it('edit from options keeps back-to-options latch', () => {
    const edit = activityManageSheetOpenEdit(true);
    expect(edit.editOpen).toBe(true);
    expect(edit.backToOptions).toBe(true);
    expect(activityManageSheetChromeIsCoherent(edit)).toBe(true);
  });

  it('closing options keeps subview', () => {
    const sub = activityManageSheetSelectSubviewFromMenu('rideshare');
    const reopened = activityManageSheetOpenOptions(sub);
    expect(reopened.view).toBe('overview');
    expect(activityManageSheetCloseOptions(reopened).optionsOpen).toBe(false);
  });
});