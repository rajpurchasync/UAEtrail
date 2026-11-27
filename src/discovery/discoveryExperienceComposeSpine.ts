/**
 * B-UNIFY-05 — shared compose + publish-reload spine for map and list discovery shells.
 */
import { useCallback, useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { AddSubmitResult } from '../explore/ui/addFlow';
import type { AvailabilityFixedSubmitResult } from '../explore/ui/intentFixedFlowEngine';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { intentOpenCompose } from './discoveryPortExploreCompose';
import { resolveCreateEntryPreset } from './discoveryPortExploreComposeSurface';
import type { BrowseListCreateFabHints } from './discoverySession';
import { resolveBrowseListCreateFabLabel } from './discoverySession';
import {
  useExploreCreateFlowBridge,
  type UseExploreCreateFlowBridgeArgs,
} from '../explore/shell/useExploreCreateFlowBridge';

type CreateFlowTap = {
  handleCreateTap: (preset: ReturnType<typeof resolveCreateEntryPreset>) => void;
};

export const useDiscoveryComposePublishReload = (
  queryClient: QueryClient,
  refreshHostGate: () => void
) =>
  useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

export const useDiscoveryCreateFabActions = ({
  compose,
  pathname,
  fabSearch,
  createFabContext,
  onBeforeCreateTap,
}: {
  compose: CreateFlowTap;
  pathname: string;
  fabSearch: string;
  createFabContext?: BrowseListCreateFabHints;
  onBeforeCreateTap?: () => void;
}) => {
  const createFabLabel = useMemo(
    () => resolveBrowseListCreateFabLabel(pathname, fabSearch, createFabContext),
    [pathname, fabSearch, createFabContext]
  );

  const handleCreateFabTap = useCallback(() => {
    onBeforeCreateTap?.();
    compose.handleCreateTap(resolveCreateEntryPreset(pathname, fabSearch, createFabContext));
  }, [compose, createFabContext, fabSearch, onBeforeCreateTap, pathname]);

  const handleOpenMarkAvailability = useCallback(() => {
    compose.handleCreateTap(intentOpenCompose());
  }, [compose]);

  return { createFabLabel, handleCreateFabTap, handleOpenMarkAvailability };
};

type DiscoveryExperienceComposeBridgeInput = Omit<
  UseExploreCreateFlowBridgeArgs,
  'handleActivityPublished' | 'handleAvailabilityFixedSubmitted' | 'handleAddSubmitted'
> & {
  queryClient: QueryClient;
  refreshHostGate: () => void;
  /** Map shell — selection-aware publish (defaults to reload-only). */
  handleActivityPublished?: (activity: ActivityDTO) => Promise<void>;
  handleAvailabilityFixedSubmitted?: (result: AvailabilityFixedSubmitResult) => void;
  handleAddSubmitted?: (result: AddSubmitResult) => void;
};

/** Registers CreateFlow bridge with shared map reload after publish/submit (explore + list). */
export const useDiscoveryExperienceComposeBridge = (input: DiscoveryExperienceComposeBridgeInput) => {
  const {
    queryClient,
    refreshHostGate,
    handleActivityPublished: handleActivityPublishedOverride,
    handleAvailabilityFixedSubmitted: handleAvailabilityFixedSubmittedOverride,
    handleAddSubmitted: handleAddSubmittedOverride,
    ...bridgeArgs
  } = input;
  const reloadFeed = useDiscoveryComposePublishReload(queryClient, refreshHostGate);

  const handleActivityPublished = useCallback(
    async (activity: ActivityDTO) => {
      if (handleActivityPublishedOverride) {
        await handleActivityPublishedOverride(activity);
        return;
      }
      await reloadFeed();
    },
    [handleActivityPublishedOverride, reloadFeed]
  );

  const handleSideEffectSubmitted = useCallback(() => {
    void reloadFeed();
  }, [reloadFeed]);

  useExploreCreateFlowBridge({
    ...bridgeArgs,
    handleActivityPublished,
    handleAvailabilityFixedSubmitted:
      handleAvailabilityFixedSubmittedOverride ?? handleSideEffectSubmitted,
    handleAddSubmitted: handleAddSubmittedOverride ?? handleSideEffectSubmitted,
  });
};