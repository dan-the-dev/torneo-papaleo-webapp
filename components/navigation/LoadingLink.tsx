'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { usePathname } from 'next/navigation';
import { useLinkPending, useNavigation } from './NavigationProvider';
import { Spinner } from '../ui/Spinner';

type LoadingLinkProps = ComponentProps<typeof Link> & {
  showSpinner?: boolean;
};

function hrefToString(href: LoadingLinkProps['href'], pathname: string): string {
  if (typeof href === 'string') {
    return href.startsWith('?') ? `${pathname}${href}` : href.split('#')[0] ?? href;
  }
  const path = href.pathname ?? '';
  const search = href.search ?? '';
  return `${path}${search}`;
}

export function LoadingLink({
  href,
  onClick,
  children,
  className = '',
  showSpinner = false,
  ...rest
}: LoadingLinkProps) {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  const hrefString = hrefToString(href, pathname);
  const isPending = useLinkPending(typeof href === 'string' && href.startsWith('?') ? href : hrefString);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const target = hrefToString(href, pathname);
    if (target.startsWith('http')) return;

    startNavigation(target);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isPending}
      className={`${className} ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
      {...rest}
    >
      {isPending && showSpinner ? (
        <span className="inline-flex items-center gap-2">
          <Spinner size="xs" />
          {children}
        </span>
      ) : (
        children
      )}
    </Link>
  );
}
