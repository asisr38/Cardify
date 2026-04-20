import * as React from 'react';
import { cn } from '../../lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[88px] w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-base leading-relaxed text-foreground shadow-soft transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
