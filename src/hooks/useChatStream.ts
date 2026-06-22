import { useEffect, useRef } from 'react';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { API_BASE_URL } from '../api/client';
import { api } from '../api/services';

const FALLBACK_POLL_MS = 60_000;
const MAX_RETRY_MS = 30_000;

interface UseChatStreamOptions {
  enabled: boolean;
  onMessage: (message: ChatMessageDTO) => void;
  onReconnect?: () => void;
}

/**
 * Subscribe to server-sent chat events via short-lived tickets.
 * Falls back to slow polling when SSE is unavailable.
 */
export const useChatStream = ({ enabled, onMessage, onReconnect }: UseChatStreamOptions) => {
  const onMessageRef = useRef(onMessage);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let retryMs = 2_000;

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const clearFallback = () => {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const startFallback = () => {
      if (fallbackTimer) return;
      fallbackTimer = setInterval(() => {
        onReconnectRef.current?.();
      }, FALLBACK_POLL_MS);
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      clearReconnect();
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, retryMs);
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
    };

    const connect = async () => {
      if (disposed) return;

      source?.close();
      source = null;

      try {
        const { data } = await api.createChatStreamTicket();
        if (disposed) return;

        const url = `${API_BASE_URL}/chat/stream?ticket=${encodeURIComponent(data.ticket)}`;
        source = new EventSource(url);

        source.addEventListener('chat_message', (event) => {
          try {
            const message = JSON.parse(event.data) as ChatMessageDTO;
            onMessageRef.current(message);
          } catch {
            // ignore malformed payloads
          }
        });

        source.addEventListener('open', () => {
          retryMs = 2_000;
          clearFallback();
          clearReconnect();
        });

        source.onerror = () => {
          source?.close();
          source = null;
          startFallback();
          onReconnectRef.current?.();
          scheduleReconnect();
        };
      } catch {
        startFallback();
        onReconnectRef.current?.();
        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      disposed = true;
      clearReconnect();
      clearFallback();
      source?.close();
    };
  }, [enabled]);
};
