import type { ExploreCompose } from '../compose';

export type GuestComposeSignInGate =
  | { kind: 'closed' }
  | { kind: 'open'; pendingRoute: ExploreCompose };

export const GUEST_COMPOSE_SIGN_IN_GATE_CLOSED: GuestComposeSignInGate = { kind: 'closed' };

export const guestComposeSignInGateIsOpen = (gate: GuestComposeSignInGate): boolean =>
  gate.kind === 'open';

export const guestComposeSignInGatePendingRoute = (
  gate: GuestComposeSignInGate
): ExploreCompose | null => (gate.kind === 'open' ? gate.pendingRoute : null);