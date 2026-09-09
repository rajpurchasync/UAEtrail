import { ApiError } from '../lib/api-error.js';
import { hasActivityJoinInstructions, JOIN_INSTRUCTION_PREFIX } from '@uaetrail/shared-types';

export { hasActivityJoinInstructions, JOIN_INSTRUCTION_PREFIX };

export const assertActivityJoinInstructions = (requirements: string[] | null | undefined): void => {
  if (!hasActivityJoinInstructions(requirements)) {
    throw new ApiError(
      400,
      'join_instructions_required',
      'Add mandatory instructions joiners must agree to before publishing.'
    );
  }
};
