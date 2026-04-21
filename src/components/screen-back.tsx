import { ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function ScreenBack({
  label = 'Back',
  onClick,
  className,
}: {
  label?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 p-0 text-sm font-medium text-gold transition-opacity hover:opacity-80',
        className,
      )}
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  );
}
