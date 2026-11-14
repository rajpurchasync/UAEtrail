import { Link, type LinkProps } from 'react-router-dom';

/** Product chrome links — `replace` avoids piling tab history on the five-tab bar. */
export const ProductNavLink = ({ to, replace = true, ...rest }: LinkProps) => (
  <Link to={to} replace={replace} {...rest} />
);
