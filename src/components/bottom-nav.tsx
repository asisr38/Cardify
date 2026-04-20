import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Users, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const items = [
  { to: '/', label: 'Events', icon: CalendarDays, end: true },
  { to: '/contacts', label: 'Contacts', icon: Users, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export function BottomNav() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/auth')) return null;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-[430px] px-4 pb-3">
        <div className="flex items-center justify-around rounded-2xl bg-primary px-2 py-2 text-primary-foreground shadow-lift">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary-foreground' : 'text-primary-foreground/55 hover:text-primary-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-ember text-ember-foreground shadow-soft',
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
