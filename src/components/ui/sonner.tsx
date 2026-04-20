import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    position="top-center"
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lift group-[.toaster]:rounded-xl',
        description: 'group-[.toast]:text-primary-foreground/80',
        actionButton: 'group-[.toast]:bg-ember group-[.toast]:text-ember-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }}
    {...props}
  />
);

export { Toaster };
