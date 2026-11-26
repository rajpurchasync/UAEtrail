import type { NavigateFunction } from 'react-router-dom';
import type { ExploreCompose } from '../discovery/discoveryPortExploreCompose';
import { composeFlowIdFromRoute } from '../discovery/discoveryPortExploreComposeFlowCatalog';
import {
  writeHostingWizardSession,
  type HostingWizardSession,
} from '../discovery/discoveryPortExploreComposeSurface';
import { createFlowPath, createFlowPathFromWindow } from './createFlowPath';

/**
 * Open an activity compose wizard on the current product surface (`?compose=activity:*`).
 * Optional session write = create-time **prefill** (place, parent activity, seeking offer).
 * Post-publish **activity graph** links (`linkedActivityId`) are separate — see `linkActivityRideshareOffer`.
 */
export type LaunchHostWizardInput = {
  navigate: NavigateFunction;
  route: ExploreCompose;
  session?: HostingWizardSession;
  sessionScope?: string;
  pathname?: string;
  search?: string;
};

export const launchHostWizard = ({
  navigate,
  route,
  session,
  sessionScope,
  pathname,
  search,
}: LaunchHostWizardInput): void => {
  const flowId = composeFlowIdFromRoute(route);
  if (flowId && session) {
    writeHostingWizardSession(flowId, session, sessionScope);
  }
  const href =
    pathname !== undefined
      ? createFlowPath(pathname, search ?? '', route)
      : createFlowPathFromWindow(route);
  navigate(href);
};