const isBackendUnavailable = (message: string): boolean =>
  /failed to fetch|networkerror|network error|load failed|econnrefused|502|503|504|proxy error|api health/i.test(
    message
  );

/** User-facing copy when explore map data fails to load. */
export const describeExploreMapLoadError = (error: unknown): string => {
  if (!error) {
    return 'Map data could not load. Check your connection and refresh.';
  }

  const message = error instanceof Error ? error.message : String(error);
  if (isBackendUnavailable(message)) {
    return 'Server unavailable — start the API (npm run dev:all) or check MongoDB, then refresh.';
  }

  return 'Map data could not load. Check your connection and refresh.';
};
