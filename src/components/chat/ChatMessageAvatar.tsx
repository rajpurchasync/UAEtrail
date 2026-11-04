import { useEffect, useState } from 'react';

export const MessageAvatar = ({
  name,
  url,
  size = 'md',
}: {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
