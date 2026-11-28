/**
 * Platform layer ↔ surface action projection (MIG-PLATFORM-LAYER-SPINE PLS-3).
 * Canonical action ids + wire paths — UI handlers stay in domain modules.
 */
import type { ActivityMapPeekActionId } from './activity-map-peek-actions.js';
import type { CatalogActionId } from './catalog-actions.js';
import { MODULE_LAYER_MATRIX, type PlatformLayer, type ProductModule } from './platform-layers.js';

export const JOIN_ACTION_IDS = ['activity_rsvp', 'activity_request', 'activity_withdraw'] as const;
export const CONNECT_ACTION_IDS = [
  'friend_request',
  'message_dm',
  'club_join',
  'crew_chat',
  'entity_follow',
] as const;
export const PLAN_ACTION_IDS = ['wishlist_save', 'goal_pin', 'availability_edit'] as const;
export const PLACE_ACTION_IDS = ['open_maps', 'arrange_trip', 'view_detail', 'submit_review'] as const;
export const MANAGE_ACTION_IDS = ['edit_supply', 'host_console', 'moderate'] as const;
export const PUBLISH_ACTION_IDS = ['compose_activity', 'compose_place', 'compose_intent'] as const;
export const DISCOVER_ACTION_IDS = ['view_detail', 'browse_feed', 'share_link'] as const;

export type JoinActionId = (typeof JOIN_ACTION_IDS)[number];
export type ConnectActionId = (typeof CONNECT_ACTION_IDS)[number];
export type PlanActionId = (typeof PLAN_ACTION_IDS)[number];
export type PlaceActionId = (typeof PLACE_ACTION_IDS)[number];
export type ManageActionId = (typeof MANAGE_ACTION_IDS)[number];
export type PublishActionId = (typeof PUBLISH_ACTION_IDS)[number];
export type DiscoverActionId = (typeof DISCOVER_ACTION_IDS)[number];

export type LayerActionId =
  | JoinActionId
  | ConnectActionId
  | PlanActionId
  | PlaceActionId
  | ManageActionId
  | PublishActionId
  | DiscoverActionId;

export type SurfaceActionDTO = {
  layer: PlatformLayer;
  id: LayerActionId;
  wire: string;
};

/** BWL paths per layer (subset — extend in place, do not fork ad-hoc strings in UI). */
export const LAYER_ACTION_WIRE: Record<PlatformLayer, Partial<Record<LayerActionId, string>>> = {
  publish: {
    compose_activity: 'POST /workspace/activities',
    compose_place: 'POST /me/submitted-places',
    compose_intent: 'PUT /me/availability',
  },
  discover: {
    view_detail: 'GET /explore/map',
    browse_feed: 'GET /discover/crew',
    share_link: 'client:share',
  },
  join: {
    activity_rsvp: 'POST /activities/:id/rsvp',
    activity_request: 'POST /activities/:id/requests',
    activity_withdraw: 'DELETE /activities/:id/rsvp',
  },
  connect: {
    friend_request: 'POST /me/friend-requests',
    message_dm: 'GET /chat',
    club_join: 'POST /me/communities/:id/join',
    crew_chat: 'POST /activities/:id/group-chat/join',
    entity_follow: 'POST /me/follows',
  },
  plan: {
    wishlist_save: 'POST /me/wishlist',
    goal_pin: 'POST /me/goals',
    availability_edit: 'PUT /me/availability',
  },
  manage: {
    edit_supply: 'PATCH /workspace/activities/:id',
    host_console: 'GET /workspace',
    moderate: 'POST /safety/reports',
  },
};

export const projectSurfaceActions = (
  module: ProductModule,
  layer: PlatformLayer
): SurfaceActionDTO[] => {
  if (!MODULE_LAYER_MATRIX[module].includes(layer)) return [];
  const wire = LAYER_ACTION_WIRE[layer];
  return Object.entries(wire).map(([id, path]) => ({
    layer,
    id: id as LayerActionId,
    wire: path,
  }));
};

/** Activity map peek wire id → platform layer (classification only). */
export const layerForPeekAction = (peekId: ActivityMapPeekActionId): PlatformLayer => {
  switch (peekId) {
    case 'request_join':
    case 'withdraw_join':
    case 'pending_join':
      return 'join';
    case 'message_host':
    case 'invite_crew':
    case 'open_crew_chat':
    case 'link_rideshare':
    case 'offer_rideshare':
      return 'connect';
    case 'manage_activity':
      return 'manage';
    case 'view_detail':
    case 'share_activity':
    default:
      return 'discover';
  }
};

/** Catalog place/facility action → layer (place module discover/plan/manage). */
export const layerForCatalogAction = (actionId: CatalogActionId): PlatformLayer => {
  switch (actionId) {
    case 'arrange_trip':
      return 'plan';
    case 'edit_submission':
    case 'moderate':
    case 'view_submitter_preview':
      return 'manage';
    case 'submit_review':
      return 'connect';
    case 'view_detail':
    case 'open_maps':
    default:
      return 'discover';
  }
};

export const projectCatalogSurfaceActions = (
  allowed: readonly CatalogActionId[]
): Array<{ layer: PlatformLayer; catalogAction: CatalogActionId }> =>
  allowed.map((catalogAction) => ({
    layer: layerForCatalogAction(catalogAction),
    catalogAction,
  }));