export function Logo({ className = 'h-10 w-auto' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="Ardor Bollate" className={className} />;
}
