export type JoinRequestMutationStatus =
  | { kind: 'idle' }
  | { kind: 'saving_note' }
  | { kind: 'withdrawing' };

export const JOIN_REQUEST_MUTATION_IDLE: JoinRequestMutationStatus = { kind: 'idle' };

export const joinRequestMutationIsSaving = (status: JoinRequestMutationStatus): boolean =>
  status.kind !== 'idle';