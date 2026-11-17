import type { ActivityManageSubview } from './activityManageViews';

/** Manage sheet navigation + overlays — options menu cannot stack on a subview. */
export type ActivityManageSheetChrome = {
  view: ActivityManageSubview;
  optionsOpen: boolean;
  backToOptions: boolean;
  editOpen: boolean;
};

export const activityManageSheetChromeClosed = (
  view: ActivityManageSubview = 'overview'
): ActivityManageSheetChrome => ({
  view,
  optionsOpen: false,
  backToOptions: false,
  editOpen: false,
});

export const activityManageSheetChromeIsCoherent = (chrome: ActivityManageSheetChrome): boolean => {
  if (chrome.optionsOpen && chrome.view !== 'overview') return false;
  if (chrome.optionsOpen && chrome.backToOptions) return false;
  if (chrome.optionsOpen && chrome.editOpen) return false;
  return true;
};

export const activityManageSheetOpenOptions = (
  chrome: ActivityManageSheetChrome
): ActivityManageSheetChrome => ({
  view: 'overview',
  optionsOpen: true,
  backToOptions: false,
  editOpen: false,
});

export const activityManageSheetCloseOptions = (
  chrome: ActivityManageSheetChrome
): ActivityManageSheetChrome => ({
  ...chrome,
  optionsOpen: false,
});

export const activityManageSheetSelectSubview = (
  subview: ActivityManageSubview,
  fromOptions: boolean
): ActivityManageSheetChrome => ({
  view: subview,
  optionsOpen: false,
  backToOptions: fromOptions,
  editOpen: false,
});

export const activityManageSheetSelectSubviewFromMenu = (
  subview: ActivityManageSubview
): ActivityManageSheetChrome => activityManageSheetSelectSubview(subview, true);

export const activityManageSheetHeaderBack = (
  chrome: ActivityManageSheetChrome
): ActivityManageSheetChrome | 'close' => {
  if (chrome.view === 'overview' && !chrome.optionsOpen) return 'close';
  if (chrome.backToOptions) {
    return { view: 'overview', optionsOpen: true, backToOptions: false, editOpen: false };
  }
  return { ...chrome, view: 'overview', backToOptions: false };
};

export const activityManageSheetOpenEdit = (fromOptions: boolean): ActivityManageSheetChrome => ({
  view: 'overview',
  optionsOpen: false,
  backToOptions: fromOptions,
  editOpen: true,
});

export const activityManageSheetCloseEdit = (
  chrome: ActivityManageSheetChrome
): ActivityManageSheetChrome => ({
  ...chrome,
  editOpen: false,
});