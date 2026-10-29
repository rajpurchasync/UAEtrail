import { extractNonJoinRequirements } from '@uaetrail/shared-types';

const TRANSPORT_LINE = /^(Reachable by|Vehicle:)/i;
const PUBLISH_METADATA_LINE =
  /^(Trail:|Difficulty:|Camp:|Going from:|Meet at:|Meeting point:|Packing ack:|Packing item:)/i;

/** Consumer scroll — what to bring / join notes only (not transport, trail metadata, or plan blobs). */
export const resolveActivityConsumerRequirementLines = (
  requirements?: string[] | null
): string[] => {
  if (!requirements?.length) return [];
  return extractNonJoinRequirements(requirements)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !TRANSPORT_LINE.test(line))
    .filter((line) => !PUBLISH_METADATA_LINE.test(line));
};
