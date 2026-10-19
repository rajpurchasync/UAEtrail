/** Organisation scope for `/publishing/*` — canonical `x-organisation-id` only. */
export const organisationRequestHeaders = (organisationId: string): Record<string, string> => ({
  'x-organisation-id': organisationId,
});
