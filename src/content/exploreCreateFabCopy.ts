/**
 * FAB + compose menu titles — shared on `/explore` and `/list`.
 * @see docs/CREATE_FLOW.md · docs/NORTHSTAR.md
 */
import { UPL_INTENT_OPEN_ACTION } from './upl-glossary';

export const EXPLORE_CREATE_FAB_HOST_TRIP = 'Host Trip';
export const EXPLORE_CREATE_FAB_ADD_VENUE = 'Add a venue';
/** Publish layer — share open intent (`compose=intent:open`); browse is the crews panel. */
export const EXPLORE_CREATE_FAB_SHARE_AVAILABILITY = UPL_INTENT_OPEN_ACTION;
/** @deprecated Use {@link EXPLORE_CREATE_FAB_SHARE_AVAILABILITY}. */
export const EXPLORE_CREATE_FAB_FIND_CREW = EXPLORE_CREATE_FAB_SHARE_AVAILABILITY;