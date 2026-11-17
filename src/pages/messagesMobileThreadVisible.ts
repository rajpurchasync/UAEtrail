/** Mobile thread chrome follows inbox URL params — not a separate boolean. */
export const messagesMobileThreadVisible = (params: URLSearchParams): boolean =>
  Boolean(params.get('to') || params.get('group'));