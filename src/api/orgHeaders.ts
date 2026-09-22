/** Organisation scope headers — send both during x-tenant-id → x-organisation-id transition. */
export const organisationRequestHeaders = (organisationId: string): Record<string, string> => ({
  'x-organisation-id': organisationId,
  'x-tenant-id': organisationId,
});
