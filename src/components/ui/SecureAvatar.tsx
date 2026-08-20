import { useEffect, useState } from 'react';
import { api } from '../../api/services';
import { extractMediaKey } from '../../lib/mediaKey';
import { formatEnvironmentUrl } from '../../utils/formatEnvironmentUrl';
import { InitialsAvatar } from './InitialsAvatar';

interface SecureAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  alt?: string;
}

type AvatarState =
  | { status: 'initials' }
  | { status: 'image'; url: string };

const requestStatus = (error: unknown): number | undefined =>
  error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: number }).status)
    : undefined;

export const SecureAvatar = ({ src, name, className = '', alt }: SecureAvatarProps) => {
  const [state, setState] = useState<AvatarState>({ status: 'initials' });

  useEffect(() => {
    let cancelled = false;
    const value = src?.trim() ?? '';

    if (!value) {
      setState({ status: 'initials' });
      return;
    }

    if (value.startsWith('blob:') || value.startsWith('data:')) {
      setState({ status: 'image', url: value });
      return;
    }

    const key = extractMediaKey(value);
    if (!key) {
      setState({ status: 'image', url: formatEnvironmentUrl(value) });
      return;
    }

    setState({ status: 'initials' });
    void api
      .resolveMedia(key)
      .then((response) => {
        if (cancelled) return;
        setState({ status: 'image', url: formatEnvironmentUrl(response.data.url) });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = requestStatus(error);
        if (status === 403 || status === 404 || !status) {
          setState({ status: 'initials' });
          return;
        }
        setState({ status: 'initials' });
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (state.status === 'initials') {
    return <InitialsAvatar name={name} className={className} />;
  }

  return (
    <img
      src={state.url}
      alt={alt ?? name}
      className={`rounded-full object-cover ${className}`}
      onError={() => setState({ status: 'initials' })}
    />
  );
};
