import { cn } from '../lib/utils';
import { initials } from '../lib/utils';

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-9 w-9 text-[11px]',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-xl',
  } as const;
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary font-serif font-medium text-primary-foreground',
        sizes[size],
        className,
      )}
    >
      {initials(name) || '?'}
    </div>
  );
}
