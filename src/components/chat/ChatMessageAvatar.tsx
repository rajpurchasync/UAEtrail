export const MessageAvatar = ({
  name,
  url,
  size = 'md',
}: {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
