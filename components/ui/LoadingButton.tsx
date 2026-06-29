'use client';

import { Spinner } from './Spinner';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
