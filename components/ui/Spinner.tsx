type SpinnerSize = 'xs' | 'sm' | 'md';

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-3.5 h-3.5 border-2',
  md: 'w-4 h-4 border-2',
};

export function Spinner({ size = 'sm', className = '' }: { size?: SpinnerSize; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Caricamento"
      className={`inline-block rounded-full border-current/30 border-t-current animate-spin shrink-0 ${sizeClasses[size]} ${className}`}
    />
  );
}
