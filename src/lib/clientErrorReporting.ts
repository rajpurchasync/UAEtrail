import type { ErrorInfo } from 'react';
import { API_BASE_URL } from '../api/client';

export const reportClientError = (error: Error, errorInfo: ErrorInfo): void => {
  void fetch(`${API_BASE_URL}/logs/client-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => undefined);
};
