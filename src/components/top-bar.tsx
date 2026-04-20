import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Props {
  title?: string;
  subtitle?: string;
  back?: boolean | (() => void);
  right?: React.ReactNode;
  translucent?: boolean;
  sticky?: boolean;
}

export function TopBar({ title, subtitle, back, right, translucent, sticky = true }: Props) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof back === 'function') return back();
    navigate(-1);
  };

  return (
    <header
      className={cn(
        'safe-top px-5 pb-3 flex items-center gap-3',
        sticky && 'sticky top-0 z-30',
        translucent ? 'bg-background/85 backdrop-blur-md' : 'bg-background',
      )}
    >
      {back ? (
        <button
          onClick={handleBack}
          aria-label="Back"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted active:scale-[0.97]"
        >
          <ChevronLeft size={22} />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        {title && (
          <h1 className="truncate font-serif text-[22px] font-semibold leading-tight text-foreground">
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
