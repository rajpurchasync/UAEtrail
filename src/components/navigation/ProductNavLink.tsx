import { type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, type LinkProps, useNavigate } from 'react-router-dom';

/** Product chrome links — commit client navigation synchronously. */
export const ProductNavLink = ({ to, onClick, replace, ...rest }: LinkProps) => {
  const navigate = useNavigate();

  return (
    <Link
      to={to}
      replace={replace}
      {...rest}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        flushSync(() => {
          navigate(to, { replace });
        });
      }}
    />
  );
};
