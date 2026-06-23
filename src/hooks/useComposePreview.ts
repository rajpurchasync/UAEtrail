import { useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComposeRailOptional } from '../context/ComposeRailContext';
import { useIsMobile } from '../hooks/useIsMobile';

interface OpenPreviewOptions {
  title?: string;
  path: string;
  content: ReactNode;
}

/** On desktop opens compose rail; on mobile navigates to full page. */
export const useComposePreview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const compose = useComposeRailOptional();

  return useCallback(
    (options: OpenPreviewOptions) => {
      if (isMobile || !compose) {
        navigate(options.path);
        return;
      }
      compose.openRail({ title: options.title, content: options.content });
    },
    [compose, isMobile, navigate]
  );
};
